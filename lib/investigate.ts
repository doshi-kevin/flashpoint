// Detective pipeline (server-side only):
//   1. numbers computed in code  2. Investigator (Claude)  3. Challenger (Claude)  4. trace.
// Any Claude failure falls back to the saved replay; the Challenger failing keeps the Investigator's result.
import Anthropic from "@anthropic-ai/sdk";
import type { Investigation, HypothesisStatus, Challenge, TraceStep, Verdict, VerdictLabel } from "./types";
import { getFallbackInvestigation, getSales, getEvents, getSignals, getStore, getStores, getTraffic } from "./data";
import { salesChangePct, anomaly, comparisonGapPts, visitsVsSpend } from "./metrics";

const STATUSES: HypothesisStatus[] = ["Strongly supported", "Plausible", "Weak", "Contradicted", "Insufficient info"];
const VERDICTS: VerdictLabel[] = ["temporary", "structural", "unclear"];

/** Strip code fences and return the first JSON object in the text. Throws if none parses. */
export function extractJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}

const strs = (x: unknown) => (Array.isArray(x) ? x.map(String) : []);
const asStatus = (x: unknown): HypothesisStatus =>
  STATUSES.includes(x as HypothesisStatus) ? (x as HypothesisStatus) : "Insufficient info";

function parseVerdict(v: unknown): Verdict | undefined {
  const o = v as { label?: unknown; reason?: unknown } | undefined;
  if (!o || !VERDICTS.includes(o.label as VerdictLabel) || typeof o.reason !== "string") return undefined;
  return { label: o.label as VerdictLabel, reason: o.reason };
}

/** Validate the Investigator output. Throws on anything unusable. */
export function parseInvestigation(raw: string): Investigation {
  const obj = extractJson(raw) as any;
  if (!Array.isArray(obj.hypotheses) || !obj.hypotheses.length) throw new Error("no hypotheses");
  if (typeof obj.unknown !== "string" || typeof obj.rationale !== "string") throw new Error("bad shape");
  if (
    !obj.question ||
    typeof obj.question.text !== "string" ||
    !Array.isArray(obj.question.options) ||
    obj.question.options.length !== 3
  )
    throw new Error("bad question");
  return {
    hypotheses: obj.hypotheses.map((h: Record<string, unknown>) => ({
      claim: String(h.claim),
      supporting: strs(h.supporting),
      counter: strs(h.counter),
      status: asStatus(h.status),
    })),
    unknown: obj.unknown,
    question: { text: obj.question.text, options: obj.question.options.map(String) },
    rationale: obj.rationale,
    verdict: parseVerdict(obj.verdict),
  };
}

/** Validate the Challenger output against the number of hypotheses. */
export function parseChallenges(raw: string, hypotheses: Investigation["hypotheses"]): Challenge[] {
  const obj = extractJson(raw) as { challenges?: { index?: unknown; challenge?: unknown; newStatus?: unknown }[] };
  if (!Array.isArray(obj.challenges)) throw new Error("no challenges");
  return obj.challenges
    .filter((c) => Number.isInteger(c.index) && hypotheses[c.index as number] && typeof c.challenge === "string")
    .map((c) => ({
      claim: hypotheses[c.index as number].claim,
      challenge: String(c.challenge),
      newStatus: asStatus(c.newStatus),
    }));
}

const INVESTIGATOR = `You are the lead detective agent investigating why a store's weekday lunch sales dropped. You work from public signals and calendar events only.
Open the case, collect clues, name suspects, and be honest about what public data cannot answer.
Rules:
- Never invent, estimate or compute numbers. Refer to figures only as given in the input.
- Never claim a cause; say the evidence points to something.
- Status words only (no percentages): "Strongly supported" | "Plausible" | "Weak" | "Contradicted" | "Insufficient info".
- Check timing: a suspect that started after the drop began cannot be its cause.
- Cite which signal supports or counters each suspect.
Respond with STRICT JSON only (no prose, no code fences):
{"hypotheses":[{"claim":string,"supporting":string[],"counter":string[],"status":string}],
"unknown":string,
"question":{"text":string,"options":[string,string,string]},
"rationale":string,
"verdict":{"label":"temporary"|"structural"|"unclear","reason":string}}
Give 3-4 hypotheses. "unknown" states what public data can't answer (why people actually left). "question" is ONE neutral question for real people that would separate the top suspects, with exactly 3 options. "verdict" is your current read on whether the decline is temporary or structural, with a one-sentence reason.`;

const CHALLENGER = `You are the Challenger agent. You receive a detective's suspects for a sales drop. Try to clear or downgrade each suspect using the evidence given.
Check: did the cause start before the drop? Does it affect only lunch? Is the evidence a single anecdote? Is it correlated with other stores that did not drop?
Never invent numbers. Status words only: "Strongly supported" | "Plausible" | "Weak" | "Contradicted" | "Insufficient info".
Respond with STRICT JSON only (no prose, no code fences):
{"challenges":[{"index":number,"challenge":string,"newStatus":string}]}
"index" is the zero-based position of the suspect. Include one entry per suspect.`;

async function ask(client: Anthropic, system: string, payload: unknown, maxTokens: number): Promise<string> {
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/** Everything numeric comes from code. */
function computeFacts(storeId: string) {
  const sales = getSales(storeId);
  const changePct = salesChangePct(sales);
  const others = getStores()
    .filter((s) => s.id !== storeId)
    .map((s) => salesChangePct(getSales(s.id)));
  const an = anomaly(sales);
  const vs = visitsVsSpend(getTraffic(storeId));
  return {
    weekdayLunchSalesChangePct: Number(changePct.toFixed(1)),
    comparisonStoresAvgChangePct: Number((others.reduce((a, b) => a + b, 0) / (others.length || 1)).toFixed(1)),
    gapVsComparisonPts: Number(comparisonGapPts(changePct, others).toFixed(1)),
    anomaly: { flagged: an.flagged, daysBelowBaselineOfLast7: an.daysBelow },
    visitsVsSpend: vs && {
      visitsPct: Number(vs.visitsPct.toFixed(1)),
      ticketPct: Number(vs.ticketPct.toFixed(1)),
    },
  };
}

function applyChallenges(inv: Investigation, challenges: Challenge[]): Investigation {
  const byClaim = new Map(challenges.map((c) => [c.claim, c]));
  return {
    ...inv,
    challenges,
    hypotheses: inv.hypotheses.map((h) => {
      const c = byClaim.get(h.claim);
      return c ? { ...h, challenge: c.challenge, status: c.newStatus } : h;
    }),
  };
}

export async function runInvestigation(
  storeId: string,
): Promise<{ result: Investigation; source: "claude" | "fallback" }> {
  const trace: TraceStep[] = [];
  const facts = (() => {
    try {
      return computeFacts(storeId);
    } catch {
      return null;
    }
  })();
  if (facts) {
    trace.push({
      step: "Opened the case",
      detail: `Weekday lunch sales ${facts.weekdayLunchSalesChangePct}% vs prior 6 weeks; comparison stores ${facts.comparisonStoresAvgChangePct}%; anomaly rule ${facts.anomaly.flagged ? "fired" : "did not fire"}.`,
      source: "lib/metrics.ts (computed in code)",
    });
  }
  const signals = getSignals(storeId);
  const events = getEvents(storeId);
  trace.push({
    step: "Collected clues",
    detail: `${signals.length} public signals and ${events.length} calendar events.`,
    source: "data/signals.json, data/events.json",
  });

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("no API key");
    const store = getStore(storeId);
    if (!store || !facts) throw new Error("unknown store");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let inv = parseInvestigation(await ask(client, INVESTIGATOR, { store, facts, events, publicSignals: signals }, 2500));
    trace.push({
      step: "Named suspects",
      detail: `${inv.hypotheses.length} suspects; verdict so far: ${inv.verdict?.label ?? "none"}.`,
      source: `Claude (${process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"})`,
    });

    try {
      const challenges = parseChallenges(
        await ask(client, CHALLENGER, { facts, events, publicSignals: signals, suspects: inv.hypotheses }, 1500),
        inv.hypotheses,
      );
      const before = new Map(inv.hypotheses.map((h) => [h.claim, h.status]));
      const changed = challenges.filter((c) => before.get(c.claim) !== c.newStatus).length;
      inv = applyChallenges(inv, challenges);
      trace.push({
        step: "Checked alibis",
        detail: `Challenger reviewed ${challenges.length} suspects and changed ${changed} status${changed === 1 ? "" : "es"}.`,
        source: "Claude (Challenger agent)",
      });
    } catch (e) {
      console.error("challenger skipped:", (e as Error).message);
      trace.push({ step: "Checked alibis", detail: "Challenger unavailable; suspects left as named.", source: "skipped" });
    }
    trace.push({
      step: "Admitted what is unknown",
      detail: inv.unknown,
      source: "Claude (Investigator)",
    });
    return { result: { ...inv, trace }, source: "claude" };
  } catch (e) {
    console.error("investigate fallback:", (e as Error).message);
    trace.push({ step: "Replay", detail: "Live call unavailable; showing the saved investigation.", source: "data/fallback-investigation.json" });
    return { result: { ...getFallbackInvestigation(), trace }, source: "fallback" };
  }
}

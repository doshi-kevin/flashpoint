// Claude call + safe parsing for the investigation. Server-side only.
import Anthropic from "@anthropic-ai/sdk";
import type { Investigation, HypothesisStatus } from "./types";
import { getFallbackInvestigation, getSales, getEvents, getSignals, getStore } from "./data";
import { salesChangePct } from "./metrics";

const STATUSES: HypothesisStatus[] = ["Strongly supported", "Plausible", "Weak", "Contradicted", "Insufficient info"];

/** Strip code fences, parse JSON, validate shape. Throws on anything unusable. */
export function parseInvestigation(raw: string): Investigation {
  const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const obj = JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
  const strs = (x: unknown) => (Array.isArray(x) ? x.map(String) : []);
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
      status: STATUSES.includes(h.status as HypothesisStatus) ? (h.status as HypothesisStatus) : "Insufficient info",
    })),
    unknown: obj.unknown,
    question: { text: obj.question.text, options: obj.question.options.map(String) },
    rationale: obj.rationale,
  };
}

const SYSTEM = `You are an analyst agent investigating a store's sales drop using public signals only.
Be honest about what public data cannot explain. Do NOT invent or compute any numbers; refer to the sales change only as given.
Respond with STRICT JSON only (no prose, no code fences) in this shape:
{"hypotheses":[{"claim":string,"supporting":string[],"counter":string[],"status":"Strongly supported"|"Plausible"|"Weak"|"Contradicted"|"Insufficient info"}],
"unknown":string,"question":{"text":string,"options":[string,string,string]},"rationale":string}
Give 3-4 hypotheses. "unknown" states what public data can't answer. "question" is ONE question to ask real people, with exactly 3 options.`;

export async function runInvestigation(
  storeId: string,
): Promise<{ result: Investigation; source: "claude" | "fallback" }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("no API key");
    const store = getStore(storeId);
    if (!store) throw new Error("unknown store");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const payload = {
      store,
      weekdayLunchSalesChangePct: Number(salesChangePct(getSales(storeId)).toFixed(1)),
      events: getEvents(storeId),
      publicSignals: getSignals(storeId),
    };
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { result: parseInvestigation(text), source: "claude" };
  } catch (e) {
    console.error("investigate fallback:", (e as Error).message);
    return { result: getFallbackInvestigation(), source: "fallback" };
  }
}

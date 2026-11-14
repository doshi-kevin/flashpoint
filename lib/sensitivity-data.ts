// Builds the sensitivity report for a store from /data and the Flashpoint adapter (server-side only).
// Every number is computed in code; labels say where each part comes from.
import { readFileSync } from "fs";
import { join } from "path";
import { getStores, getSales } from "./data";
import { salesChangePct } from "./metrics";
import { getFlashpointAdapter } from "./flashpoint";
import studyResults from "@/data/study-results.json";
import profiles from "@/data/store-profiles.json";
import decisionModels from "@/data/decision-model.json";
import calendar from "@/data/calendar.json";
import dataQuality from "@/data/data-quality.json";
import type { StudyResults } from "./types";
import {
  anomalyUnderSpecs,
  breakEven,
  dailyTotals,
  districtSignals,
  evaluate,
  exposure,
  liveState,
  liveTrace,
  pooledPriceResponse,
  priceEvidence,
  rainSensitivity,
  relativeToComparison,
  tornado,
  valueOfInformation,
  type DecisionModel,
  type Param,
  type PosRow,
} from "./sensitivity";

type Profile = { district: string; format: string; comparisonStores: string[] };
type DMAction = {
  id: string;
  label: string;
  fixedCost: number;
  costPerWeek: number;
  costPerLunchVisit: number;
  recovery: Record<string, number>;
  note: string;
};
type DMSpec = {
  horizonWeeks: number;
  contributionMargin: number;
  hypotheses: { id: string; label: string; option: string; prior: number }[];
  priorStrength: number;
  actions: DMAction[];
  evidenceRungs: { id: string; label: string; completes: number; cost: number; costNote: string; latency: string }[];
};
type CalendarEntry = { start: string; end?: string; scope: string; type: string; label: string };

const PROFILES = profiles as Record<string, Profile>;
const SPECS = decisionModels as unknown as Record<string, DMSpec>;
const RAIN_DATES = (calendar as CalendarEntry[]).filter((c) => c.type === "weather" && /heavy rain/i.test(c.label)).map((c) => c.start);
/** Days with a known POS or power issue for a store: excluded from comparisons. */
const badDays = (storeId: string) => (dataQuality as { store: string; date: string }[]).filter((q) => q.store === storeId).map((q) => q.date);
const PRICE_CHANGE = (calendar as CalendarEntry[]).find((c) => c.type === "price")?.start ?? null;

let posCache: PosRow[] | null = null;
/** POS fact table, parsed once per server process. */
export function loadPos(): PosRow[] {
  if (posCache) return posCache;
  const text = readFileSync(join(process.cwd(), "data", "pos", "daily_daypart_channel.csv"), "utf8");
  posCache = text
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => {
      const [date, store, daypart, channel, tx, net] = l.split(",");
      return { date, store, daypart, channel, tx: Number(tx), net: Number(net) };
    });
  return posCache;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : 0);

/** Same windows as lib/metrics.ts: last 15 weekdays vs the 30 before. */
function windows(storeId: string) {
  const s = getSales(storeId);
  return { recentStart: s[Math.max(0, s.length - 15)]?.date ?? "", baseStart: s[Math.max(0, s.length - 45)]?.date ?? "" };
}

function comparisonStores(storeId: string): string[] {
  const p = PROFILES[storeId];
  if (!p) return [];
  if (p.comparisonStores.length) return p.comparisonStores;
  return Object.keys(PROFILES).filter((id) => id !== storeId && PROFILES[id].district === p.district);
}

/**
 * Where, when and how the store moved: visits change by daypart and by lunch channel, each also shown
 * relative to the comparison stores (which cancels chain-wide moves like promotions and seasonality),
 * and the change point vs comparison stores.
 */
function dropProfile(rows: PosRow[], storeId: string) {
  const { recentStart, baseStart } = windows(storeId);
  const comps = comparisonStores(storeId);
  const changeFor = (id: string, keep: (r: PosRow) => boolean) => {
    const m = dailyTotals(rows, id, keep);
    const v = (from: string, to: string) => avg([...m.entries()].filter(([d]) => d >= from && d < to).map(([, x]) => x.tx));
    const before = v(baseStart, recentStart);
    return before ? (v(recentStart, "9999") / before - 1) * 100 : 0;
  };
  const change = (keep: (r: PosRow) => boolean) => {
    const own = changeFor(storeId, keep);
    const compAvg = comps.length ? avg(comps.map((id) => changeFor(id, keep))) : 0;
    return { pct: r1(own), vsComparisonPts: r1(own - compAvg) };
  };
  const s = getSales(storeId);
  const comp = comparisonStores(storeId).map((id) => getSales(id));
  const rel = relativeToComparison(s, comp);
  let best = { gap: 0, date: null as string | null };
  for (let k = 10; k < rel.length - 5; k++) {
    const gap = avg(rel.slice(0, k).map((p) => p.sales)) - avg(rel.slice(k).map((p) => p.sales));
    if (gap > best.gap) best = { gap, date: rel[k].date };
  }
  return {
    changePointVsComparison: best.date,
    visitsChangeByDaypart: Object.fromEntries(
      ["breakfast", "lunch", "afternoon", "dinner", "late_night"].map((d) => [d, change((r) => r.daypart === d)]),
    ),
    lunchVisitsChangeByChannel: Object.fromEntries(
      ["drive_thru", "counter", "mobile_pickup", "delivery"].map((c) => [c, change((r) => r.daypart === "lunch" && r.channel === c)]),
    ),
  };
}

function economicReport(storeId: string) {
  const rows = loadPos();
  const all = getStores().map((s) => ({ id: s.id, district: PROFILES[s.id]?.district ?? "", change: salesChangePct(getSales(s.id)) }));
  const districtIds = (d: string) => Object.keys(PROFILES).filter((id) => PROFILES[id].district === d);
  const comp = comparisonStores(storeId);
  const series = getSales(storeId);
  return {
    label: "SYNTHETIC store data; computed in code (lib/sensitivity.ts)",
    store: {
      id: storeId,
      district: PROFILES[storeId]?.district,
      comparisonStores: comp,
      drop: dropProfile(rows, storeId),
      rain: { dates: RAIN_DATES, ...rainSensitivity(rows, storeId, RAIN_DATES, badDays(storeId)) },
      exposure: exposure(rows, storeId),
      anomalyRobustness: {
        ownBaseline: anomalyUnderSpecs(series),
        vsComparisonStores: anomalyUnderSpecs(
          relativeToComparison(
            series,
            comp.map((id) => getSales(id)),
          ),
        ),
      },
    },
    districts: districtSignals(all, [storeId]).map((d) => ({
      ...d,
      priceResponse: PRICE_CHANGE ? pooledPriceResponse(rows, districtIds(d.district), PRICE_CHANGE) : null,
    })),
    chainPriceResponse: PRICE_CHANGE ? { changeDate: PRICE_CHANGE, ...pooledPriceResponse(rows, Object.keys(PROFILES), PRICE_CHANGE) } : null,
  };
}

/** Builds the decision model with the dollars at stake and costs computed from the store's own data. */
export function buildDecisionModel(storeId: string): { model: DecisionModel; spec: DMSpec; lunchVisitsPerWeek: number; lostSalesPerWeek: number } | null {
  const spec = SPECS[storeId];
  if (!spec) return null;
  const { recentStart, baseStart } = windows(storeId);
  const lunch = dailyTotals(loadPos(), storeId, (r) => r.daypart === "lunch");
  const win = (from: string, to: string) => [...lunch.entries()].filter(([d]) => d >= from && d < to).map(([, v]) => v);
  const base = win(baseStart, recentStart);
  const recent = win(recentStart, "9999");
  const lostPerDay = Math.max(0, avg(base.map((v) => v.net)) - avg(recent.map((v) => v.net)));
  const lunchVisitsPerWeek = avg(recent.map((v) => v.tx)) * 7;
  const atStake = lostPerDay * 7 * spec.horizonWeeks * spec.contributionMargin;
  const model: DecisionModel = {
    hypotheses: spec.hypotheses.map((h) => ({ id: h.id, label: h.label })),
    atStake,
    actions: spec.actions.map((a) => ({
      id: a.id,
      label: a.label,
      cost: a.fixedCost + spec.horizonWeeks * (a.costPerWeek + a.costPerLunchVisit * lunchVisitsPerWeek),
      recovery: spec.hypotheses.map((h) => a.recovery[h.id] ?? 0),
    })),
  };
  return { model, spec, lunchVisitsPerWeek, lostSalesPerWeek: lostPerDay * 7 };
}

function sharesFromPercent(spec: DMSpec, study: StudyResults, pct: number[]): number[] {
  const raw = spec.hypotheses.map((h) => {
    const i = study.options.indexOf(h.option);
    return i >= 0 ? pct[i] / 100 : 0;
  });
  const t = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((x) => x / t);
}

function tornadoParams(model: DecisionModel, spec: DMSpec): Param[] {
  const idx = (id: string) => spec.actions.findIndex((a) => a.id === id);
  const params: Param[] = spec.hypotheses.map((h, i) => ({
    id: `share_${h.id}`,
    label: `Share of lost customers who left over ${h.label.split(" (")[0].toLowerCase()}`,
    kind: "share" as const,
    h: i,
    low: 0.1,
    high: 0.7,
  }));
  params.push({ id: "at_stake", label: "Contribution at stake (±40%)", kind: "atStake", low: model.atStake * 0.6, high: model.atStake * 1.4 });
  for (const a of spec.actions) {
    const i = idx(a.id);
    if (model.actions[i].cost > 0)
      params.push({ id: `cost_${a.id}`, label: `Cost of: ${a.label} (−40% / +50%)`, kind: "cost", a: i, low: model.actions[i].cost * 0.6, high: model.actions[i].cost * 1.5 });
  }
  spec.hypotheses.forEach((h, hi) => {
    // How well the action aimed at this reason works if it is the reason.
    const target = spec.actions.reduce((best, a, ai) => (a.recovery[h.id] > (spec.actions[best].recovery[h.id] ?? 0) ? ai : best), 0);
    const base = model.actions[target].recovery[hi];
    params.push({
      id: `recovery_${spec.actions[target].id}_${h.id}`,
      label: `How well "${spec.actions[target].label}" works if ${h.id} is the reason`,
      kind: "recovery",
      a: target,
      h: hi,
      low: Math.max(0, base - 0.25),
      high: Math.min(1, base + 0.2),
    });
  });
  return params;
}

/**
 * Full sensitivity report for a store. `upTo` replays the first N Flashpoint answers (mock mode),
 * so a screen can step through the live analysis; omit it for everything received so far.
 */
export async function getSensitivityReport(storeId: string, upTo?: number) {
  if (!PROFILES[storeId]) return null;
  const economic = economicReport(storeId);
  const built = buildDecisionModel(storeId);
  if (!built) return { storeId, economic, decision: null, live: null };

  const { model, spec, lunchVisitsPerWeek, lostSalesPerWeek } = built;
  const prior = spec.hypotheses.map((h) => h.prior);
  const k = spec.priorStrength;
  const study = (studyResults as Record<string, StudyResults>)[storeId];
  const t = tornado(model, prior, tornadoParams(model, spec));
  const topShare = t.rows.find((r) => r.id.startsWith("share_"));
  const topH = topShare ? spec.hypotheses.findIndex((h) => `share_${h.id}` === topShare.id) : 0;

  const adapter = getFlashpointAdapter();
  const counts = await adapter.getStudyCounts(storeId, upTo);
  const toH = (option: string) => spec.hypotheses.findIndex((h) => h.option === option);
  const hCounts = spec.hypotheses.map(() => 0);
  counts?.options.forEach((o, i) => {
    const h = toH(o);
    if (h >= 0) hCounts[h] += counts.counts[i];
  });
  const targetN = counts?.targetN ?? 0;
  const trace =
    counts?.arrivals && counts.arrivals.length
      ? liveTrace(
          model,
          prior,
          k,
          counts.arrivals.map(toH).filter((h) => h >= 0),
          targetN,
          { every: 5 },
        )
      : null;
  const current = liveState(model, prior, k, hCounts, targetN);
  const rungs = priceEvidence(model, prior, k, spec.evidenceRungs);
  const chosen = rungs.find((r) => r.worthIt) ?? null;
  const settledAt = trace?.settledAt ?? null;
  const completesSaved = settledAt !== null ? Math.max(0, targetN - settledAt) : null;

  return {
    storeId,
    economic,
    decision: {
      label: "DESIGNED assumptions (data/decision-model.json); every number computed in code",
      atStake: Math.round(model.atStake),
      lostLunchSalesPerWeek: Math.round(lostSalesPerWeek),
      lunchVisitsPerWeek: Math.round(lunchVisitsPerWeek),
      horizonWeeks: spec.horizonWeeks,
      contributionMargin: spec.contributionMargin,
      actions: model.actions.map((a, i) => ({ id: a.id, label: a.label, cost: Math.round(a.cost), note: spec.actions[i].note })),
      hypotheses: spec.hypotheses.map((h) => ({ id: h.id, label: h.label, flashpointOption: h.option, prior: h.prior })),
      onPublicDataOnly: evaluate(model, prior),
      onAIPersonas: study ? { label: "SYNTHETIC: Flashpoint AI personas, contrast only", ...evaluate(model, sharesFromPercent(spec, study, study.synthetic)) } : null,
      tornado: t,
      mostSensitiveUnknown: topShare
        ? {
            hypothesis: spec.hypotheses[topH].id,
            label: topShare.label,
            breakEven: breakEven(model, prior, topH),
            askFlashpoint: study?.question ?? null,
            answersMapToActions: spec.hypotheses.map((h) => {
              const best = spec.actions.reduce((b, a) => ((a.recovery[h.id] ?? 0) > (b.recovery[h.id] ?? 0) ? a : b), spec.actions[0]);
              return { option: h.option, reason: h.id, action: best.id };
            }),
          }
        : null,
      valueOfPerfectInformation: valueOfInformation(model, prior, k),
      evidenceLadder: rungs,
      recommendedEvidence: chosen ? chosen.id : null,
    },
    live: {
      label: adapter.mode === "live" ? "LIVE: Flashpoint analytics" : "REPLAY: saved Flashpoint answers (data/flashpoint-replay.json)",
      mode: adapter.mode,
      question: counts?.question ?? null,
      n: counts?.n ?? 0,
      targetN,
      current,
      decisionNow: evaluate(model, current.shares),
      trace: trace?.states ?? null,
      settledAt,
      completesSaved,
      /** What stopping at settledAt would save at each rung's price per complete. */
      costSavedByRung:
        completesSaved === null ? null : Object.fromEntries(rungs.map((r) => [r.id, Math.round((completesSaved * r.cost) / r.completes)])),
    },
  };
}

export type SensitivityReport = NonNullable<Awaited<ReturnType<typeof getSensitivityReport>>>;

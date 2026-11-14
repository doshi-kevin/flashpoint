// Sensitivity core: pure, deterministic functions (no I/O, no LLM, seeded randomness).
//
// Two halves:
//   ECONOMIC sensitivity: how a store's sales respond to shocks it shares with the city
//     (rain, the chain's price rise, a local employer's layoffs), measured from POS data.
//   DECISION sensitivity: which unknown the decision depends on (tornado, break-even),
//     whether a Flashpoint study is worth its price and which evidence rung to buy
//     (value of information), and when live Flashpoint answers have made the decision
//     robust enough to stop paying for more (probability the decision flips).
//
// The model: lost lunch contribution ("at stake") is split across reasons customers left
// (shares, summing to 1). Action a recovers recovery[a][h] of the share for reason h.
//   EV(a | shares) = atStake * sum_h shares[h] * recovery[a][h] - cost[a]
// Uncertainty about the shares is a Dirichlet(prior * k + counts) distribution; Flashpoint
// answers are the counts.

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                   */
/* ------------------------------------------------------------------ */

export type Rng = () => number;

/** mulberry32: tiny, fast, deterministic. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng: Rng): number {
  return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

/** Gamma(shape, 1) by Marsaglia-Tsang. */
export function gammaSample(shape: number, rng: Rng): number {
  if (shape < 1) return gammaSample(shape + 1, rng) * Math.pow(rng(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function dirichletSample(alpha: number[], rng: Rng): number[] {
  const g = alpha.map((a) => gammaSample(a, rng));
  const s = g.reduce((t, x) => t + x, 0);
  return g.map((x) => x / s);
}

function categorical(p: number[], rng: Rng): number {
  const u = rng();
  let acc = 0;
  for (let i = 0; i < p.length; i++) {
    acc += p[i];
    if (u < acc) return i;
  }
  return p.length - 1;
}

export function multinomial(n: number, p: number[], rng: Rng): number[] {
  const out = p.map(() => 0);
  for (let k = 0; k < n; k++) out[categorical(p, rng)]++;
  return out;
}

const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------ */
/* Decision model                                                      */
/* ------------------------------------------------------------------ */

export type Hypothesis = { id: string; label: string };
export type Action = { id: string; label: string; cost: number; recovery: number[] }; // recovery aligned with hypotheses
export type DecisionModel = { hypotheses: Hypothesis[]; actions: Action[]; atStake: number };

export function expectedValue(model: DecisionModel, a: number, shares: number[]): number {
  const act = model.actions[a];
  let r = 0;
  for (let h = 0; h < shares.length; h++) r += shares[h] * act.recovery[h];
  return model.atStake * r - act.cost;
}

export type Ranked = { id: string; label: string; ev: number };

/** Actions ranked by expected value (best first). */
export function evaluate(model: DecisionModel, shares: number[]): { best: string; ranked: Ranked[] } {
  const ranked = model.actions
    .map((a, i) => ({ id: a.id, label: a.label, ev: round(expectedValue(model, i, shares)) }))
    .sort((x, y) => y.ev - x.ev);
  return { best: ranked[0].id, ranked };
}

function bestIndex(model: DecisionModel, shares: number[]): number {
  let bi = 0;
  let bv = -Infinity;
  model.actions.forEach((_, i) => {
    const v = expectedValue(model, i, shares);
    if (v > bv) {
      bv = v;
      bi = i;
    }
  });
  return bi;
}

/** Set one hypothesis' share to v and rescale the others proportionally so shares still sum to 1. */
export function setShare(shares: number[], h: number, v: number): number[] {
  const rest = sum(shares) - shares[h];
  return shares.map((s, i) => (i === h ? v : rest > 0 ? (s / rest) * (1 - v) : (1 - v) / (shares.length - 1)));
}

export type Param =
  | { id: string; label: string; kind: "share"; h: number; low: number; high: number }
  | { id: string; label: string; kind: "cost"; a: number; low: number; high: number }
  | { id: string; label: string; kind: "recovery"; a: number; h: number; low: number; high: number }
  | { id: string; label: string; kind: "atStake"; low: number; high: number };

function applyParam(model: DecisionModel, shares: number[], p: Param, v: number): { model: DecisionModel; shares: number[] } {
  switch (p.kind) {
    case "share":
      return { model, shares: setShare(shares, p.h, v) };
    case "cost":
      return { model: { ...model, actions: model.actions.map((a, i) => (i === p.a ? { ...a, cost: v } : a)) }, shares };
    case "recovery":
      return {
        model: {
          ...model,
          actions: model.actions.map((a, i) => (i === p.a ? { ...a, recovery: a.recovery.map((r, j) => (j === p.h ? v : r)) } : a)),
        },
        shares,
      };
    case "atStake":
      return { model: { ...model, atStake: v }, shares };
  }
}

export type TornadoRow = {
  id: string;
  label: string;
  low: number;
  high: number;
  /** EV(base decision) minus EV(best alternative). Negative means the decision flips. */
  advantageAtLow: number;
  advantageAtHigh: number;
  bestAtLow: string;
  bestAtHigh: string;
  swing: number;
  flips: boolean;
};

/**
 * One-way sensitivity ("tornado"): move each assumption across its range and measure how much
 * the base decision's advantage over the next-best action changes, and whether the decision flips.
 * Rows are sorted by swing, largest first: the top row is what the decision depends on most.
 */
export function tornado(model: DecisionModel, shares: number[], params: Param[]): { base: string; rows: TornadoRow[] } {
  const base = bestIndex(model, shares);
  const advantage = (m: DecisionModel, s: number[]) => {
    const ev = m.actions.map((_, i) => expectedValue(m, i, s));
    const alt = Math.max(...ev.filter((_, i) => i !== base));
    return ev[base] - alt;
  };
  const rows = params.map((p) => {
    const lo = applyParam(model, shares, p, p.low);
    const hi = applyParam(model, shares, p, p.high);
    const bLo = bestIndex(lo.model, lo.shares);
    const bHi = bestIndex(hi.model, hi.shares);
    const aLo = advantage(lo.model, lo.shares);
    const aHi = advantage(hi.model, hi.shares);
    return {
      id: p.id,
      label: p.label,
      low: p.low,
      high: p.high,
      advantageAtLow: round(aLo),
      advantageAtHigh: round(aHi),
      bestAtLow: model.actions[bLo].id,
      bestAtHigh: model.actions[bHi].id,
      swing: round(Math.abs(aHi - aLo)),
      flips: bLo !== base || bHi !== base,
    };
  });
  rows.sort((x, y) => y.swing - x.swing);
  return { base: model.actions[base].id, rows };
}

/** Which action is best as one reason's share moves from 0 to 1 (others rescaled). */
export function breakEven(model: DecisionModel, shares: number[], h: number, steps = 100): { from: number; to: number; best: string }[] {
  const segs: { from: number; to: number; best: string }[] = [];
  for (let k = 0; k <= steps; k++) {
    const v = k / steps;
    const b = model.actions[bestIndex(model, setShare(shares, h, v))].id;
    const last = segs[segs.length - 1];
    if (last && last.best === b) last.to = v;
    else segs.push({ from: v, to: v, best: b });
  }
  return segs;
}

/**
 * Value of information, by simulation. Shares are uncertain: p ~ Dirichlet(prior * k).
 * - sampleN undefined: perfect information (decide knowing p).
 * - sampleN = n: a survey of n respondents (counts ~ Multinomial(n, p)); decide on the posterior mean.
 * Value = E[EV of the informed decision under the true p] - E[EV of today's decision under the true p].
 */
export function valueOfInformation(
  model: DecisionModel,
  prior: number[],
  k: number,
  opts: { sampleN?: number; sims?: number; seed?: number } = {},
): number {
  const sims = opts.sims ?? 4000;
  const rng = seededRng(opts.seed ?? 1);
  const alpha = prior.map((p) => p * k);
  const now = bestIndex(model, prior);
  let gain = 0;
  for (let s = 0; s < sims; s++) {
    const p = dirichletSample(alpha, rng);
    let pick: number;
    if (opts.sampleN === undefined) pick = bestIndex(model, p);
    else {
      const c = multinomial(opts.sampleN, p, rng);
      const post = alpha.map((a, i) => a + c[i]);
      const tot = sum(post);
      pick = bestIndex(
        model,
        post.map((x) => x / tot),
      );
    }
    gain += expectedValue(model, pick, p) - expectedValue(model, now, p);
  }
  return round(gain / sims);
}

export type Rung = { id: string; label: string; completes: number; cost: number };
export type RungValue = Rung & { value: number; net: number; worthIt: boolean };

/** Prices each evidence rung: expected value of its sample against its cost. Best net value first. */
export function priceEvidence(model: DecisionModel, prior: number[], k: number, rungs: Rung[], seed = 7): RungValue[] {
  return rungs
    .map((r) => {
      const value = valueOfInformation(model, prior, k, { sampleN: r.completes, seed });
      const net = round(value - r.cost);
      return { ...r, value, net, worthIt: net > 0 };
    })
    .sort((a, b) => b.net - a.net);
}

/* ------------------------------------------------------------------ */
/* Live: decision robustness as Flashpoint answers arrive              */
/* ------------------------------------------------------------------ */

export type LiveState = {
  n: number;
  shares: number[];
  low: number[]; // 5th percentile
  high: number[]; // 95th percentile
  best: string;
  /** Probability the decision would change if fielding continued to targetN. */
  pFlip: number;
};

/**
 * Posterior after `counts` answers, and the chance that more answers (up to targetN) flip the decision.
 * Seeded by the answer count, so the same counts always give the same numbers (trace or single call).
 */
export function liveState(
  model: DecisionModel,
  prior: number[],
  k: number,
  counts: number[],
  targetN: number,
  sims = 1500,
  seed = 23,
): LiveState {
  const rng = seededRng(seed * 1000 + sum(counts));
  const alpha = prior.map((p, i) => p * k + counts[i]);
  const tot = sum(alpha);
  const shares = alpha.map((a) => a / tot);
  const now = bestIndex(model, shares);
  const n = sum(counts);
  const remaining = Math.max(0, targetN - n);
  const draws: number[][] = shares.map(() => []);
  let flips = 0;
  for (let s = 0; s < sims; s++) {
    const p = dirichletSample(alpha, rng);
    p.forEach((x, i) => draws[i].push(x));
    if (remaining) {
      const more = multinomial(remaining, p, rng);
      const fin = alpha.map((a, i) => a + more[i]);
      const ft = sum(fin);
      if (
        bestIndex(
          model,
          fin.map((x) => x / ft),
        ) !== now
      )
        flips++;
    }
  }
  draws.forEach((d) => d.sort((a, b) => a - b));
  return {
    n,
    shares: shares.map((x) => round(x, 3)),
    low: draws.map((d) => round(quantile(d, 0.05), 3)),
    high: draws.map((d) => round(quantile(d, 0.95), 3)),
    best: model.actions[now].id,
    pFlip: round(flips / sims, 3),
  };
}

/**
 * Replays answers in arrival order and reports the robustness trace. `settledAt` is the first
 * response count (at least `minN`) after which the chance of a flip stays below `threshold` for the rest of the trace:
 * the point where more paid answers could no longer change the decision.
 */
export function liveTrace(
  model: DecisionModel,
  prior: number[],
  k: number,
  answers: number[], // hypothesis index per respondent, in arrival order
  targetN: number,
  opts: { threshold?: number; every?: number; sims?: number; seed?: number; minN?: number } = {},
): { states: LiveState[]; settledAt: number | null } {
  const threshold = opts.threshold ?? 0.05;
  const every = opts.every ?? 1;
  const minN = opts.minN ?? 20; // never call a decision settled on a handful of answers
  const counts = prior.map(() => 0);
  const states: LiveState[] = [liveState(model, prior, k, counts, targetN, opts.sims, opts.seed)];
  answers.forEach((h, i) => {
    counts[h]++;
    if ((i + 1) % every === 0 || i === answers.length - 1) states.push(liveState(model, prior, k, counts, targetN, opts.sims, opts.seed));
  });
  let settledAt: number | null = null;
  for (let i = states.length - 1; i >= 0; i--) {
    if (states[i].pFlip < threshold && states[i].n >= minN) settledAt = states[i].n;
    else break;
  }
  return { states, settledAt };
}

/* ------------------------------------------------------------------ */
/* Economic sensitivity (from POS rows)                                */
/* ------------------------------------------------------------------ */

export type PosRow = { date: string; store: string; daypart: string; channel: string; tx: number; net: number };

const dow = (d: string) => new Date(d + "T12:00:00Z").getUTCDay();
const shiftDays = (d: string, k: number) => new Date(Date.parse(d + "T12:00:00Z") + k * 864e5).toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b ? (a / b - 1) * 100 : 0);

/** Daily totals for one store, optionally filtered (by daypart/channel). */
export function dailyTotals(rows: PosRow[], store: string, keep: (r: PosRow) => boolean = () => true): Map<string, { tx: number; net: number }> {
  const m = new Map<string, { tx: number; net: number }>();
  for (const r of rows) {
    if (r.store !== store || !keep(r)) continue;
    const v = m.get(r.date) ?? { tx: 0, net: 0 };
    v.tx += r.tx;
    v.net += r.net;
    m.set(r.date, v);
  }
  return m;
}

/**
 * Rain sensitivity: % change on rain days vs the other weekdays of the SAME week (adjusted for each
 * weekday's usual level), per channel. Using the same week keeps a store's own level shifts (like
 * Store 14's roadworks) out of the comparison. Walk-in = counter. Null for a channel the store lacks.
 */
export function rainSensitivity(rows: PosRow[], store: string, rainDates: string[], excludeDates: string[] = []) {
  const ch = (c: string | null) => {
    const m = dailyTotals(rows, store, (r) => c === null || r.channel === c);
    // Typical level per weekday (median over non-rain, non-excluded weekdays) to adjust neighbours.
    const level = new Map<number, number>();
    for (let w = 1; w <= 5; w++) {
      level.set(
        w,
        median(
          [...m.entries()].filter(([d]) => dow(d) === w && !rainDates.includes(d) && !excludeDates.includes(d)).map(([, v]) => v.tx),
        ),
      );
    }
    const changes: number[] = [];
    for (const d of rainDates) {
      const today = m.get(d)?.tx;
      const wd = dow(d);
      if (today === undefined || wd < 1 || wd > 5 || !level.get(wd)) continue;
      const neighbours = [1, 2, 3, 4, 5]
        .map((w) => shiftDays(d, w - wd))
        .filter((x) => x !== d && !rainDates.includes(x) && !excludeDates.includes(x) && m.has(x) && level.get(dow(x)))
        .map((x) => (m.get(x)!.tx / level.get(dow(x))!) * level.get(wd)!);
      if (!neighbours.length) continue;
      changes.push(pct(today, median(neighbours)));
    }
    return changes.length ? round(mean(changes), 1) : null;
  };
  const hasDT = rows.some((r) => r.store === store && r.channel === "drive_thru" && r.tx > 0);
  return {
    walkInPct: ch("counter"),
    driveThruPct: hasDT ? ch("drive_thru") : null,
    deliveryPct: ch("delivery"),
    visitsPct: ch(null),
  };
}

/** Response to a price change: visits and ticket before vs after `changeDate` (equal windows). */
export function priceResponse(rows: PosRow[], store: string, changeDate: string, days = 14) {
  const m = dailyTotals(rows, store);
  const win = (from: string, to: string) => {
    const v = [...m.entries()].filter(([d]) => d >= from && d < to).map(([, x]) => x);
    const tx = sum(v.map((x) => x.tx));
    const net = sum(v.map((x) => x.net));
    return { visitsPerDay: v.length ? tx / v.length : 0, ticket: tx ? net / tx : 0 };
  };
  const before = win(shiftDays(changeDate, -days), changeDate);
  const after = win(changeDate, shiftDays(changeDate, days));
  const ticketPct = pct(after.ticket, before.ticket);
  const visitsPct = pct(after.visitsPerDay, before.visitsPerDay);
  return {
    ticketPct: round(ticketPct, 1),
    visitsPct: round(visitsPct, 1),
    elasticity: Math.abs(ticketPct) > 0.5 ? round(visitsPct / ticketPct, 2) : null,
  };
}

/**
 * Price response pooled across a group of stores (one store's two weeks are too noisy to read a
 * small price effect). Returns the group mean and the spread across stores.
 */
export function pooledPriceResponse(rows: PosRow[], stores: string[], changeDate: string, days = 14) {
  const per = stores.map((s) => priceResponse(rows, s, changeDate, days));
  const tk = per.map((p) => p.ticketPct);
  const vs = per.map((p) => p.visitsPct);
  const sd = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
  const t = mean(tk);
  const v = mean(vs);
  const se = stores.length > 1 ? sd(vs) / Math.sqrt(stores.length) : Infinity;
  return {
    stores: stores.length,
    ticketPct: round(t, 1),
    visitsPct: round(v, 1),
    visitsStdErrPts: round(se, 2),
    /** Visits moved by more than 2 standard errors: a real response, not noise. */
    significant: Math.abs(v) > 2 * se,
    elasticity: Math.abs(t) > 0.5 ? round(v / t, 2) : null,
  };
}

/** Share of sales by channel and by lunch: how exposed a store is to access and lunch shocks. */
export function exposure(rows: PosRow[], store: string) {
  let total = 0;
  let dt = 0;
  let del = 0;
  let lunch = 0;
  for (const r of rows) {
    if (r.store !== store) continue;
    total += r.net;
    if (r.channel === "drive_thru") dt += r.net;
    if (r.channel === "delivery") del += r.net;
    if (r.daypart === "lunch") lunch += r.net;
  }
  return {
    driveThruShare: total ? round(dt / total, 3) : 0,
    deliveryShare: total ? round(del / total, 3) : 0,
    lunchShare: total ? round(lunch / total, 3) : 0,
  };
}

/**
 * Local-shock signal: each district's average change vs the MEDIAN of the other districts' averages
 * (percentage points), so one outlying district can't make the others look unusual. A whole district
 * moving together is a neighbourhood economy signal, not a store problem.
 */
export function districtSignals(stores: { id: string; district: string; change: number }[], exclude: string[] = [], thresholdPts = 3) {
  const kept = stores.filter((s) => !exclude.includes(s.id));
  const districts = [...new Set(kept.map((s) => s.district))];
  const districtMean = (d: string) => mean(kept.filter((s) => s.district === d).map((s) => s.change));
  return districts
    .map((d) => {
      const inD = kept.filter((s) => s.district === d).map((s) => s.change);
      const ref = median(districts.filter((o) => o !== d).map(districtMean));
      const vs = mean(inD) - ref;
      const sameDirection = inD.filter((c) => Math.sign(c - ref) === Math.sign(vs)).length / (inD.length || 1);
      return {
        district: d,
        stores: inD.length,
        changePct: round(mean(inD), 1),
        vsRestPts: round(vs, 1),
        sameDirection: round(sameDirection, 2),
        signal: Math.abs(vs) >= thresholdPts && sameDirection >= 0.75,
      };
    })
    .sort((a, b) => a.vsRestPts - b.vsRestPts);
}

/* ------------------------------------------------------------------ */
/* Robustness of the anomaly finding                                   */
/* ------------------------------------------------------------------ */

export type Spec = { baselineWeeks: number; z: number };
export const DEFAULT_SPECS: Spec[] = [4, 6, 8].flatMap((w) => [1.5, 2, 2.5].map((z) => ({ baselineWeeks: w, z })));

type Point = { date: string; sales: number };

/** Store sales divided by its comparison stores' average on the same day (rescaled to store units). */
export function relativeToComparison(series: Point[], comparison: Point[][]): Point[] {
  const compByDate = new Map<string, number[]>();
  for (const c of comparison) for (const p of c) compByDate.set(p.date, [...(compByDate.get(p.date) ?? []), p.sales]);
  const ratios = series.map((p) => {
    const c = compByDate.get(p.date);
    return { date: p.date, r: c && c.length ? p.sales / mean(c) : NaN };
  });
  const scale = mean(series.map((p) => p.sales)) / mean(ratios.filter((x) => Number.isFinite(x.r)).map((x) => x.r));
  return ratios.filter((x) => Number.isFinite(x.r)).map((x) => ({ date: x.date, sales: x.r * scale }));
}

/**
 * Re-runs the drop detection under different reasonable choices (baseline length x threshold).
 * The baseline is fixed BEFORE the recent window (so the drop can't hide inside its own baseline).
 * Flag = at least 5 of the last 7 weekdays more than z robust standard deviations below baseline.
 * Pass the series through relativeToComparison() first to cancel moves the whole chain shares.
 */
export function anomalyUnderSpecs(series: Point[], specs: Spec[] = DEFAULT_SPECS, recentDays = 15) {
  const recentStart = Math.max(0, series.length - recentDays);
  const last7 = series.slice(-7);
  const results = specs.map((sp) => {
    const base = series.slice(Math.max(0, recentStart - sp.baselineWeeks * 5), recentStart);
    const medFor = (d: string) => median(base.filter((q) => dow(q.date) === dow(d)).map((q) => q.sales));
    const resid = base.map((q) => q.sales - medFor(q.date));
    const center = median(resid);
    const mad = median(resid.map((r) => Math.abs(r - center))) * 1.4826 || 1;
    const below = last7.filter((d) => (d.sales - medFor(d.date) - center) / mad < -sp.z).length;
    return { ...sp, daysBelow: below, flagged: below >= 5 };
  });
  return { flaggedShare: round(results.filter((r) => r.flagged).length / results.length, 2), results };
}

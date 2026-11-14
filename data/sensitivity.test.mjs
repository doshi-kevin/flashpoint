// Tests for lib/sensitivity.ts: the maths on constructed cases with known answers, then the
// story on our data. Run: node --test data/sensitivity.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../lib/sensitivity.ts";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} expected ${b} ± ${tol}, got ${a}`);

// A two-reason, three-action toy model with hand-checkable numbers.
const toy = {
  hypotheses: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  atStake: 1000,
  actions: [
    { id: "fixA", label: "fix A", cost: 200, recovery: [0.8, 0] },
    { id: "fixB", label: "fix B", cost: 200, recovery: [0, 0.8] },
    { id: "wait", label: "wait", cost: 0, recovery: [0, 0] },
  ],
};

/* ---------------- randomness ---------------- */

test("seeded randomness is reproducible and Dirichlet draws are valid", () => {
  const a = S.seededRng(42);
  const b = S.seededRng(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  const rng = S.seededRng(1);
  const alpha = [2, 5, 3];
  const draws = Array.from({ length: 4000 }, () => S.dirichletSample(alpha, rng));
  for (const d of draws.slice(0, 50)) close(d.reduce((t, x) => t + x, 0), 1, 1e-9, "sums to 1");
  [0.2, 0.5, 0.3].forEach((m, i) => close(draws.reduce((t, d) => t + d[i], 0) / draws.length, m, 0.02, `mean ${i}`));
  const c = S.multinomial(500, [0.5, 0.5], S.seededRng(3));
  assert.equal(c[0] + c[1], 500);
});

/* ---------------- decision model ---------------- */

test("expected value and ranking match hand calculation", () => {
  // shares 0.7/0.3: fixA = 1000*0.7*0.8-200 = 360; fixB = 1000*0.3*0.8-200 = 40; wait = 0
  close(S.expectedValue(toy, 0, [0.7, 0.3]), 360, 1e-9);
  close(S.expectedValue(toy, 1, [0.7, 0.3]), 40, 1e-9);
  const e = S.evaluate(toy, [0.7, 0.3]);
  assert.equal(e.best, "fixA");
  assert.deepEqual(
    e.ranked.map((r) => r.id),
    ["fixA", "fixB", "wait"],
  );
});

test("setShare keeps shares summing to 1 and preserves the others' proportions", () => {
  const s = S.setShare([0.5, 0.3, 0.2], 0, 0.8);
  close(s.reduce((t, x) => t + x, 0), 1, 1e-12);
  close(s[1] / s[2], 1.5, 1e-12);
});

test("break-even: with symmetric actions the decision switches at a 50% share", () => {
  const segs = S.breakEven(toy, [0.5, 0.5], 0);
  assert.equal(segs[0].from, 0);
  assert.equal(segs.at(-1).to, 1);
  const toA = segs.find((g) => g.best === "fixA");
  close(toA.from, 0.5, 0.011, "switch point");
  // Below 25% of either reason, neither fix pays for itself (1000*0.25*0.8 = 200): wait wins in the middle? No:
  // at share_a = 0.1, fixB = 1000*0.9*0.8-200 = 520 > 0, so fixB wins below 0.5.
  assert.equal(segs[0].best, "fixB");
});

test("tornado: the uncertain share outranks a small cost change, and flips are detected", () => {
  const t = S.tornado(toy, [0.6, 0.4], [
    { id: "share_a", label: "share A", kind: "share", h: 0, low: 0.2, high: 0.9 },
    { id: "cost_fixA", label: "cost fix A", kind: "cost", a: 0, low: 180, high: 220 },
  ]);
  assert.equal(t.base, "fixA");
  assert.equal(t.rows[0].id, "share_a");
  assert.equal(t.rows[0].flips, true);
  assert.equal(t.rows[0].bestAtLow, "fixB");
  assert.equal(t.rows[1].flips, false);
});

test("value of information: never negative, perfect info >= a survey, bigger survey >= smaller", () => {
  const prior = [0.5, 0.5];
  const evpi = S.valueOfInformation(toy, prior, 4, { seed: 5 });
  const big = S.valueOfInformation(toy, prior, 4, { sampleN: 200, seed: 5 });
  const small = S.valueOfInformation(toy, prior, 4, { sampleN: 5, seed: 5 });
  assert.ok(evpi > 0 && small >= 0);
  assert.ok(evpi >= big - 5, `EVPI ${evpi} vs n=200 ${big}`);
  assert.ok(big >= small - 5, `n=200 ${big} vs n=5 ${small}`);
  // When one action wins whatever the shares, information is worthless.
  const dominated = { ...toy, actions: [{ id: "free", label: "free", cost: -1000, recovery: [0, 0] }, ...toy.actions] };
  close(S.valueOfInformation(dominated, prior, 4, { seed: 5 }), 0, 1e-9);
});

test("evidence ladder: picks the rung with the best net value, flags rungs that cost more than they're worth", () => {
  const rungs = S.priceEvidence(toy, [0.5, 0.5], 4, [
    { id: "cheap", label: "cheap", completes: 100, cost: 10 },
    { id: "pricey", label: "pricey", completes: 100, cost: 1e6 },
  ]);
  assert.equal(rungs[0].id, "cheap");
  assert.equal(rungs[0].worthIt, true);
  assert.equal(rungs.find((r) => r.id === "pricey").worthIt, false);
});

/* ---------------- live robustness ---------------- */

test("live state is deterministic for the same counts and settles with overwhelming evidence", () => {
  const a = S.liveState(toy, [0.5, 0.5], 4, [3, 2], 100);
  const b = S.liveState(toy, [0.5, 0.5], 4, [3, 2], 100);
  assert.deepEqual(a, b);
  assert.ok(a.pFlip > 0.1, `5 answers shouldn't settle a 60/40 split (pFlip ${a.pFlip})`);
  const strong = S.liveState(toy, [0.5, 0.5], 4, [90, 10], 100);
  assert.equal(strong.best, "fixA");
  assert.ok(strong.pFlip < 0.01);
  assert.equal(S.liveState(toy, [0.5, 0.5], 4, [30, 20], 50).pFlip, 0, "no answers left means no flip");
  assert.ok(strong.low[0] < strong.shares[0] && strong.shares[0] < strong.high[0]);
});

test("live trace: settledAt respects the minimum sample and matches single-call states", () => {
  const answers = Array.from({ length: 80 }, (_, i) => (i % 5 === 0 ? 1 : 0)); // 80% reason A
  const tr = S.liveTrace(toy, [0.5, 0.5], 4, answers, 80, { every: 5, minN: 20 });
  assert.ok(tr.settledAt !== null && tr.settledAt >= 20, `settledAt ${tr.settledAt}`);
  const at = tr.states.find((s) => s.n === tr.settledAt);
  const counts = [answers.slice(0, at.n).filter((h) => h === 0).length, answers.slice(0, at.n).filter((h) => h === 1).length];
  assert.deepEqual(S.liveState(toy, [0.5, 0.5], 4, counts, 80), at);
});

/* ---------------- economic sensitivity ---------------- */

// Build simple POS rows: two weeks of weekdays, one store, counter 100/day, delivery 20/day.
function rowsWith(adjust) {
  const rows = [];
  for (let d = new Date("2026-11-02T12:00:00Z"); d <= new Date("2026-11-13T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const [c, del] = adjust(date);
    rows.push({ date, store: "X", daypart: "lunch", channel: "counter", tx: c, net: c * 10 });
    rows.push({ date, store: "X", daypart: "lunch", channel: "delivery", tx: del, net: del * 16 });
  }
  return rows;
}

test("rain sensitivity recovers a planted rain effect against same-week days", () => {
  const rows = rowsWith((date) => (date === "2026-11-04" ? [80, 26] : [100, 20]));
  const r = S.rainSensitivity(rows, "X", ["2026-11-04"]);
  close(r.walkInPct, -20, 0.01);
  close(r.deliveryPct, 30, 0.01);
  assert.equal(r.driveThruPct, null, "no drive-thru channel");
});

test("price response and pooled elasticity", () => {
  const rows = rowsWith((date) => (date >= "2026-11-09" ? [95, 20] : [100, 20]));
  // Raise the ticket 10% from 9 Nov.
  for (const r of rows) if (r.date >= "2026-11-09") r.net *= 1.1;
  const p = S.priceResponse(rows, "X", "2026-11-09", 7);
  close(p.ticketPct, 10, 0.5);
  assert.ok(p.visitsPct < 0);
  assert.ok(p.elasticity < 0);
  const pooled = S.pooledPriceResponse(rows, ["X"], "2026-11-09", 7);
  assert.equal(pooled.significant, false, "one store can't establish significance");
});

test("district signals: one district moving together is flagged; others aren't, even when the outlier drags the average", () => {
  const stores = [];
  ["A", "B", "C", "D"].forEach((d) => {
    for (let i = 0; i < 6; i++) stores.push({ id: d + i, district: d, change: (d === "D" ? -8 : -2) + (i % 2 ? 0.5 : -0.5) });
  });
  const sig = S.districtSignals(stores);
  assert.deepEqual(
    sig.filter((x) => x.signal).map((x) => x.district),
    ["D"],
  );
});

test("anomaly robustness: a clear step drop is flagged under every spec; noise alone under none", () => {
  const rng = S.seededRng(9);
  const days = [];
  for (let d = new Date("2026-08-17T12:00:00Z"); days.length < 65; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd >= 1 && wd <= 5) days.push(d.toISOString().slice(0, 10));
  }
  const noise = () => 1 + (rng() - 0.5) * 0.06;
  const flat = days.map((date) => ({ date, sales: 1000 * noise() }));
  const drop = days.map((date, i) => ({ date, sales: 1000 * noise() * (i >= 50 ? 0.75 : 1) }));
  assert.equal(S.anomalyUnderSpecs(drop).flaggedShare, 1);
  assert.equal(S.anomalyUnderSpecs(flat).flaggedShare, 0);
  // A chain-wide dip shared with comparison stores disappears relative to them.
  const comp = days.map((date, i) => ({ date, sales: 900 * noise() * (i >= 50 ? 0.75 : 1) }));
  assert.equal(S.anomalyUnderSpecs(S.relativeToComparison(drop, [comp])).flaggedShare, 0);
});

/* ---------------- the story on our data ---------------- */

const load = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
const rows = readFileSync(new URL("pos/daily_daypart_channel.csv", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((l) => {
    const [date, store, daypart, channel, tx, net] = l.split(",");
    return { date, store, daypart, channel, tx: +tx, net: +net };
  });
const sales = load("sales.json");
const profiles = load("store-profiles.json");
const spec = load("decision-model.json")["14"];
const study = load("study-results.json")["14"];
const replay = load("flashpoint-replay.json")["14"];

// Mirrors lib/sensitivity-data.ts buildDecisionModel (same windows as lib/metrics.ts).
function storeModel() {
  const s = sales["14"];
  const recentStart = s[s.length - 15].date;
  const baseStart = s[s.length - 45].date;
  const lunch = S.dailyTotals(rows, "14", (r) => r.daypart === "lunch");
  const win = (a, b) => [...lunch.entries()].filter(([d]) => d >= a && d < b).map(([, v]) => v);
  const mean = (xs) => xs.reduce((t, x) => t + x, 0) / xs.length;
  const lost = mean(win(baseStart, recentStart).map((v) => v.net)) - mean(win(recentStart, "9999").map((v) => v.net));
  const visitsWk = mean(win(recentStart, "9999").map((v) => v.tx)) * 7;
  return {
    hypotheses: spec.hypotheses.map((h) => ({ id: h.id, label: h.label })),
    atStake: lost * 7 * spec.horizonWeeks * spec.contributionMargin,
    actions: spec.actions.map((a) => ({
      id: a.id,
      label: a.label,
      cost: a.fixedCost + spec.horizonWeeks * (a.costPerWeek + a.costPerLunchVisit * visitsWk),
      recovery: spec.hypotheses.map((h) => a.recovery[h.id]),
    })),
  };
}
const model = storeModel();
const prior = spec.hypotheses.map((h) => h.prior);
const shares = (pct) => spec.hypotheses.map((h) => pct[study.options.indexOf(h.option)] / 100);

test("story: public data alone and AI personas both point to the promo; real Flashpoint answers flip it to the speed fix", () => {
  assert.equal(S.evaluate(model, prior).best, "promo");
  assert.equal(S.evaluate(model, shares(study.synthetic)).best, "promo");
  const counts = spec.hypotheses.map((h) => replay.answers.filter((a) => a.option === h.option).length);
  const live = S.liveState(model, prior, spec.priorStrength, counts, replay.targetN);
  assert.equal(live.best, "speed_fix");
});

test("story: the decision hinges on why customers left — the top tornado bar is a reason share, and it flips the decision", () => {
  const params = [
    ...spec.hypotheses.map((h, i) => ({ id: `share_${h.id}`, label: h.id, kind: "share", h: i, low: 0.1, high: 0.7 })),
    { id: "at_stake", label: "at stake", kind: "atStake", low: model.atStake * 0.6, high: model.atStake * 1.4 },
  ];
  const t = S.tornado(model, prior, params);
  assert.ok(t.rows[0].id.startsWith("share_"));
  assert.equal(t.rows[0].flips, true);
});

test("story: asking is worth it, and the cheap own-customer survey beats the panel", () => {
  const rungs = S.priceEvidence(model, prior, spec.priorStrength, spec.evidenceRungs);
  assert.equal(rungs[0].id, "own_list");
  assert.ok(rungs[0].net > 0);
  assert.ok(S.valueOfInformation(model, prior, spec.priorStrength) > rungs[0].cost);
});

test("story: the live decision settles well before all 120 answers are in", () => {
  const answers = replay.answers.map((a) => spec.hypotheses.findIndex((h) => h.option === a.option));
  const tr = S.liveTrace(model, prior, spec.priorStrength, answers, replay.targetN, { every: 5 });
  assert.ok(tr.settledAt !== null && tr.settledAt <= 60, `settledAt ${tr.settledAt}`);
  assert.equal(tr.states.at(-1).best, "speed_fix");
});

test("story: Store 14 is the only store flagged against its comparison stores; Eastfield is the only district signal", () => {
  const comps = (id) =>
    (profiles[id].comparisonStores.length
      ? profiles[id].comparisonStores
      : Object.keys(profiles).filter((x) => x !== id && profiles[x].district === profiles[id].district)
    ).map((c) => sales[c]);
  const flagged = Object.keys(sales).filter((id) => S.anomalyUnderSpecs(S.relativeToComparison(sales[id], comps(id))).flaggedShare >= 0.5);
  assert.deepEqual(flagged, ["14"]);
  const pctChange = (arr) => {
    const m = (xs) => xs.reduce((t, p) => t + p.sales, 0) / xs.length;
    return (m(arr.slice(-15)) / m(arr.slice(-45, -15)) - 1) * 100;
  };
  const all = Object.keys(sales).map((id) => ({ id, district: profiles[id].district, change: pctChange(sales[id]) }));
  assert.deepEqual(
    S.districtSignals(all, ["14"])
      .filter((d) => d.signal)
      .map((d) => d.district),
    ["Eastfield"],
  );
});

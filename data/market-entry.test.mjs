// Tests for lib/market-entry.ts: the maths on hand-checkable cases, then the store #51 story on
// data/market-entry.json. Run: node --test data/market-entry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "../lib/market-entry.ts";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} expected ${b} ± ${tol}, got ${a}`);
const A = {
  buildCost: 1_000_000,
  contributionMargin: 0.2,
  years: 10,
  discountRate: 0,
  visitsPerUserPerWeek: 1,
  sayDoBase: 0.5,
  sayDoPerPullPoint: 0.005,
  competitorDrag: 0.1,
  passByCapture: 0,
};
const desk = { adults3mi: 10_000, medianIncome: 60_000, dailyTraffic: 0, burgerCompetitors: 0, rentPerYear: 0 };

test("projection matches hand calculation", () => {
  // 10,000 adults * 0.4 * 1 visit * 0.5 would-visit * 0.5 say-do = 1,000 visits/wk; *52*$10 = $520,000
  const p = M.project(A, desk, { burgerShare: 0.4, wouldVisit: 0.5, ticket: 10, pull: 100 });
  assert.equal(p.weeklyVisits, 1000);
  assert.equal(p.annualSales, 520_000);
  assert.equal(p.annualContribution, 104_000);
  assert.equal(p.npv, 104_000 * 10 - 1_000_000); // zero discount rate -> annuity = years
  // Each competitor takes a share: 2 competitors at 0.1 drag -> divide by 1.2
  close(M.project(A, { ...desk, burgerCompetitors: 2 }, { burgerShare: 0.4, wouldVisit: 0.5, ticket: 10, pull: 100 }).weeklyVisits, 833, 1);
});

test("annuity and say-do factor", () => {
  close(M.annuity(10, 0.1), 6.1446, 1e-4);
  assert.equal(M.annuity(5, 0), 5);
  assert.equal(M.sayDo(A, 100), 0.5);
  close(M.sayDo(A, 160), 0.8, 1e-12);
  assert.equal(M.sayDo(A, 400), 0.9, "clamped high");
  assert.equal(M.sayDo(A, -400), 0.1, "clamped low");
});

test("choose returns null (don't open) when no area has positive value", () => {
  const areas = [{ id: "x", name: "x", desk }];
  assert.equal(M.choose(A, areas, { x: { burgerShare: 0.01, wouldVisit: 0.01, ticket: 5, pull: 100 } }).pick, null);
  assert.equal(M.choose(A, areas, { x: { burgerShare: 0.9, wouldVisit: 0.9, ticket: 15, pull: 150 } }).pick, "x");
});

test("concept read: say-do gap and clear winner", () => {
  const r = M.readConcepts("B", "Breakfast", { Breakfast: [120, 104, 140], Bundle: [168, 146, 192], Classic: [100, 86, 116] });
  assert.equal(r.didTop, "Bundle");
  assert.equal(r.sayDoGap, true);
  assert.equal(r.clearWinner, true);
  const overlap = M.readConcepts("A", "Classic", { Classic: [105, 90, 120], Bundle: [100, 85, 115] });
  assert.equal(overlap.sayDoGap, false);
  assert.equal(overlap.clearWinner, false);
});

test("value of research: deterministic, never negative on average, and the experiment adds value", () => {
  const areas = [
    { id: "p", name: "p", desk: { adults3mi: 40_000, medianIncome: 70_000, dailyTraffic: 20_000, burgerCompetitors: 3, rentPerYear: 100_000 } },
    { id: "q", name: "q", desk: { adults3mi: 45_000, medianIncome: 60_000, dailyTraffic: 25_000, burgerCompetitors: 5, rentPerYear: 110_000 } },
  ];
  const a = { ...A, buildCost: 2_000_000, discountRate: 0.1, visitsPerUserPerWeek: 1.1, sayDoBase: 0.45, sayDoPerPullPoint: 0.004, competitorDrag: 0.08, passByCapture: 0.006 };
  const s1 = M.valueOfResearch(a, areas, "survey", 1500, 3);
  assert.equal(M.valueOfResearch(a, areas, "survey", 1500, 3), s1, "same seed, same answer");
  assert.ok(s1 >= 0);
  assert.equal(M.valueOfResearch(a, areas, "desk", 500, 3), 0);
  assert.ok(M.valueOfResearch(a, areas, "survey_experiment", 1500, 3) >= s1 * 0.95);
});

/* ---------------- the store #51 story on data/market-entry.json ---------------- */

const E = JSON.parse(readFileSync(new URL("market-entry.json", import.meta.url), "utf8"));
const a = E.assumptions;
const areas = E.candidates.map((c) => ({ id: c.id, name: c.name, desk: c.desk }));
const bestPull = (id) => Math.max(...Object.values(E.experiment.pullByArea[id]).map((v) => v[0]));
const view = (withExperiment) =>
  Object.fromEntries(
    E.candidates.map((c) => [
      c.id,
      { burgerShare: c.survey.burgerQsrWeeklyShare, wouldVisit: c.survey.wouldVisitShare, ticket: c.survey.avgTicket, pull: withExperiment ? bestPull(c.id) : 100 },
    ]),
  );
const npv = (inputs, id) => M.project(a, areas.find((x) => x.id === id).desk, inputs[id]).npv;

test("story: desk research can't find a winner; Flashpoint research picks Maple Crossing (B)", () => {
  const deskView = Object.fromEntries(areas.map((x) => [x.id, M.DESK_PRIOR]));
  const desk = M.choose(a, areas, deskView);
  assert.notEqual(desk.pick, "B");
  assert.equal(desk.ranked.at(-1).id, "B", "on paper, Maple Crossing looks worst");
  assert.equal(M.choose(a, areas, view(false)).pick, "B");
  assert.equal(M.choose(a, areas, view(true)).pick, "B");
  assert.ok(npv(view(true), "B") > 1_000_000);
  assert.ok(npv(view(true), "A") < 0, "Ridgeway, the commuter corridor, would lose money");
});

test("story: the say-do gap in Maple Crossing points to a new product (the family bundle)", () => {
  const b = E.candidates.find((c) => c.id === "B");
  const r = M.readConcepts("B", b.survey.topConcept, E.experiment.pullByArea.B);
  assert.equal(r.sayDoGap, true);
  assert.equal(r.didTop, "$6 family bundle");
  assert.equal(r.clearWinner, true);
});

test("story: Flashpoint research pays back many times its cost", () => {
  for (const rung of E.researchRungs.filter((r) => r.id !== "desk")) {
    const value = M.valueOfResearch(a, areas, rung.id);
    assert.ok(value > 10 * rung.cost, `${rung.id}: value ${value} vs cost ${rung.cost}`);
  }
});

test("story: the pick survives every assumption range tested (robust choice)", () => {
  const v = view(true);
  const set = (key, val) => ({ a: { ...a, [key]: val }, inputs: v });
  const onB = (key, val) => ({ a, inputs: { ...v, B: { ...v.B, [key]: val } } });
  const params = [
    { id: "margin", label: "", low: 0.16, high: 0.24, apply: (_a, _i, x) => set("contributionMargin", x) },
    { id: "build", label: "", low: 1.6e6, high: 2.6e6, apply: (_a, _i, x) => set("buildCost", x) },
    { id: "sayDoBase", label: "", low: 0.35, high: 0.55, apply: (_a, _i, x) => set("sayDoBase", x) },
    { id: "wouldVisitB", label: "", low: v.B.wouldVisit - 0.1, high: v.B.wouldVisit + 0.1, apply: (_a, _i, x) => onB("wouldVisit", x) },
    { id: "pullB", label: "", low: v.B.pull - 30, high: v.B.pull + 30, apply: (_a, _i, x) => onB("pull", x) },
  ];
  const t = M.siteTornado(a, areas, v, params);
  assert.equal(t.basePick, "B");
  assert.ok(t.rows.every((r) => !r.flips), "no single assumption flips the site");
});

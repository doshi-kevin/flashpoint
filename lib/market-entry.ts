// Market-entry engine for "where should store #51 go, and with what menu?" (pure, deterministic, no LLM).
//
// Demand for a candidate trade area, per week:
//   local   = adults * burgerShare * visitsPerUser * wouldVisit * sayDo / (1 + competitorDrag * competitors)
//   passBy  = dailyTraffic * 7 * passByCapture
//   sales   = (local + passBy) * 52 * ticket            (annual unit volume)
//   value   = (sales * margin - rent) * annuity(years, rate) - buildCost   (10-year NPV)
// What Flashpoint adds:
//   ZIP survey        -> burgerShare, wouldVisit (stated), ticket, concept ranking (what people SAY)
//   Market Experiment -> Pull of each concept in market (what people DO) -> sayDo factor
// Without research those inputs fall back to desk priors, and the choice can be wrong by millions.

type Rng = () => number;

/** mulberry32: small deterministic generator (kept local so this module has no imports). */
function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Assumptions = {
  buildCost: number;
  contributionMargin: number;
  years: number;
  discountRate: number;
  visitsPerUserPerWeek: number;
  sayDoBase: number;
  sayDoPerPullPoint: number;
  competitorDrag: number;
  passByCapture: number;
};

export type Desk = { adults3mi: number; medianIncome: number; dailyTraffic: number; burgerCompetitors: number; rentPerYear: number };

export type Inputs = { burgerShare: number; wouldVisit: number; ticket: number; pull: number };

/** What desk research alone assumes for every area (no Flashpoint). */
export const DESK_PRIOR: Inputs = { burgerShare: 0.33, wouldVisit: 0.32, ticket: 12, pull: 100 };
/** How uncertain those desk assumptions are (standard deviations) before any Flashpoint research. */
export const PRIOR_SD: Inputs = { burgerShare: 0.05, wouldVisit: 0.1, ticket: 1.5, pull: 30 };
/** Measurement noise of each Flashpoint instrument (standard deviations). */
export const SURVEY_SD = { burgerShare: 0.03, wouldVisit: 0.04, ticket: 0.5 }; // n=300 sampling + stated-answer noise
export const EXPERIMENT_SD = { pull: 10 }; // Pull with ~±20 95% interval

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

export function annuity(years: number, rate: number): number {
  return rate ? (1 - Math.pow(1 + rate, -years)) / rate : years;
}

export function sayDo(a: Assumptions, pull: number): number {
  return clamp(a.sayDoBase + a.sayDoPerPullPoint * (pull - 100), 0.1, 0.9);
}

export type Projection = {
  weeklyVisits: number;
  captureShare: number;
  annualSales: number;
  annualContribution: number;
  npv: number;
};

export function project(a: Assumptions, d: Desk, x: Inputs): Projection {
  const sd = sayDo(a, x.pull);
  const capture = (x.wouldVisit * sd) / (1 + a.competitorDrag * d.burgerCompetitors);
  const local = d.adults3mi * x.burgerShare * a.visitsPerUserPerWeek * capture;
  const passBy = d.dailyTraffic * 7 * a.passByCapture;
  const weeklyVisits = local + passBy;
  const annualSales = weeklyVisits * 52 * x.ticket;
  const annualContribution = annualSales * a.contributionMargin - d.rentPerYear;
  const npv = annualContribution * annuity(a.years, a.discountRate) - a.buildCost;
  return {
    weeklyVisits: round(weeklyVisits),
    captureShare: round(x.wouldVisit * a.visitsPerUserPerWeek * sd / (1 + a.competitorDrag * d.burgerCompetitors), 4),
    annualSales: round(annualSales),
    annualContribution: round(annualContribution),
    npv: round(npv),
  };
}

export type Area = { id: string; name: string; desk: Desk };
export type Choice = { pick: string | null; ranked: { id: string; npv: number }[] };

/** Best area by NPV, or null ("don't open") when no area has positive value. */
export function choose(a: Assumptions, areas: Area[], inputs: Record<string, Inputs>): Choice {
  const ranked = areas.map((ar) => ({ id: ar.id, npv: project(a, ar.desk, inputs[ar.id]).npv })).sort((x, y) => y.npv - x.npv);
  return { pick: ranked[0] && ranked[0].npv > 0 ? ranked[0].id : null, ranked };
}

/* ---------------- concepts: say vs do ---------------- */

export type ConceptRead = {
  area: string;
  saidTop: string; // survey (MaxDiff / stated)
  didTop: string; // Market Experiment (highest Pull)
  pull: Record<string, { pull: number; low: number; high: number }>;
  sayDoGap: boolean;
  /** Top concept's interval clears every other concept's interval: a clear winner. */
  clearWinner: boolean;
};

export function readConcepts(area: string, saidTop: string, pullByConcept: Record<string, [number, number, number]>): ConceptRead {
  const entries = Object.entries(pullByConcept).map(([c, [p, lo, hi]]) => ({ c, p, lo, hi }));
  entries.sort((x, y) => y.p - x.p);
  const top = entries[0];
  return {
    area,
    saidTop,
    didTop: top.c,
    pull: Object.fromEntries(entries.map((e) => [e.c, { pull: e.p, low: e.lo, high: e.hi }])),
    sayDoGap: saidTop !== top.c,
    clearWinner: entries.slice(1).every((e) => top.lo > e.hi),
  };
}

/* ---------------- sensitivity of the site choice ---------------- */

export type SiteParam = {
  id: string;
  label: string;
  low: number;
  high: number;
  apply: (a: Assumptions, inputs: Record<string, Inputs>, v: number) => { a: Assumptions; inputs: Record<string, Inputs> };
};

/** One-way sensitivity: does the pick change, and how much does the winner's lead move? */
export function siteTornado(a: Assumptions, areas: Area[], inputs: Record<string, Inputs>, params: SiteParam[]) {
  const base = choose(a, areas, inputs);
  const lead = (c: Choice) => (c.ranked.length > 1 ? c.ranked[0].npv - Math.max(0, c.ranked[1].npv) : c.ranked[0]?.npv ?? 0);
  const rows = params.map((p) => {
    const lo = p.apply(a, inputs, p.low);
    const hi = p.apply(a, inputs, p.high);
    const cLo = choose(lo.a, areas, lo.inputs);
    const cHi = choose(hi.a, areas, hi.inputs);
    const npvOf = (c: Choice, id: string | null) => (id ? c.ranked.find((r) => r.id === id)?.npv ?? 0 : 0);
    return {
      id: p.id,
      label: p.label,
      low: p.low,
      high: p.high,
      pickAtLow: cLo.pick,
      pickAtHigh: cHi.pick,
      basePickNpvAtLow: npvOf(cLo, base.pick),
      basePickNpvAtHigh: npvOf(cHi, base.pick),
      swing: Math.abs(npvOf(cHi, base.pick) - npvOf(cLo, base.pick)),
      flips: cLo.pick !== base.pick || cHi.pick !== base.pick,
    };
  });
  rows.sort((x, y) => y.swing - x.swing);
  return { basePick: base.pick, baseLead: round(lead(base)), rows };
}

/* ---------------- value of each research rung ---------------- */

function normal(rng: Rng): number {
  return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

/** Normal-normal update: posterior mean given a prior and one noisy measurement. */
function shrink(prior: number, priorSd: number, obs: number, obsSd: number): number {
  const w = priorSd ** 2 / (priorSd ** 2 + obsSd ** 2);
  return prior + w * (obs - prior);
}

export type RungId = "desk" | "survey" | "survey_experiment";

/**
 * Preposterior value of research, by simulation. Each draw invents a "true" world from the desk priors,
 * simulates what each Flashpoint instrument would measure (with its noise), picks a site on that
 * information, and scores the pick against the truth. Value = mean truth-NPV of the informed pick minus
 * that of the desk-only pick. Information can only help on average; it pays when the pick might change.
 */
export function valueOfResearch(a: Assumptions, areas: Area[], rung: RungId, sims = 3000, seed = 17): number {
  const rng = seededRng(seed);
  let gain = 0;
  const deskInputs = Object.fromEntries(areas.map((ar) => [ar.id, DESK_PRIOR]));
  const deskPick = choose(a, areas, deskInputs).pick;
  for (let s = 0; s < sims; s++) {
    const truth: Record<string, Inputs> = {};
    const seen: Record<string, Inputs> = {};
    for (const ar of areas) {
      const t: Inputs = {
        burgerShare: clamp(DESK_PRIOR.burgerShare + normal(rng) * PRIOR_SD.burgerShare, 0.05, 0.8),
        wouldVisit: clamp(DESK_PRIOR.wouldVisit + normal(rng) * PRIOR_SD.wouldVisit, 0.02, 0.9),
        ticket: clamp(DESK_PRIOR.ticket + normal(rng) * PRIOR_SD.ticket, 5, 25),
        pull: clamp(DESK_PRIOR.pull + normal(rng) * PRIOR_SD.pull, 20, 250),
      };
      truth[ar.id] = t;
      if (rung === "desk") seen[ar.id] = DESK_PRIOR;
      else {
        const o = (v: number, sd: number) => v + normal(rng) * sd;
        seen[ar.id] = {
          burgerShare: shrink(DESK_PRIOR.burgerShare, PRIOR_SD.burgerShare, o(t.burgerShare, SURVEY_SD.burgerShare), SURVEY_SD.burgerShare),
          wouldVisit: shrink(DESK_PRIOR.wouldVisit, PRIOR_SD.wouldVisit, o(t.wouldVisit, SURVEY_SD.wouldVisit), SURVEY_SD.wouldVisit),
          ticket: shrink(DESK_PRIOR.ticket, PRIOR_SD.ticket, o(t.ticket, SURVEY_SD.ticket), SURVEY_SD.ticket),
          pull: rung === "survey_experiment" ? shrink(DESK_PRIOR.pull, PRIOR_SD.pull, o(t.pull, EXPERIMENT_SD.pull), EXPERIMENT_SD.pull) : DESK_PRIOR.pull,
        };
      }
    }
    const pick = choose(a, areas, seen).pick;
    const npv = (id: string | null) => (id ? project(a, areas.find((x) => x.id === id)!.desk, truth[id]).npv : 0);
    gain += npv(pick) - npv(deskPick);
  }
  return round(gain / sims);
}

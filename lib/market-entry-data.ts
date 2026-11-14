// Builds the store #51 market-entry report from data/market-entry.json (server-side).
// Every number is computed in code by lib/market-entry.ts; labels say what is synthetic, designed or simulated.
import entry from "@/data/market-entry.json";
import {
  choose,
  project,
  readConcepts,
  siteTornado,
  valueOfResearch,
  DESK_PRIOR,
  type Area,
  type Assumptions,
  type Inputs,
  type RungId,
  type SiteParam,
} from "./market-entry";

type Candidate = {
  id: string;
  name: string;
  zips: string[];
  story: string;
  desk: Area["desk"];
  survey: { completes: number; burgerQsrWeeklyShare: number; wouldVisitShare: number; avgTicket: number; topConcept: string; verbatims: string[] };
};
type Entry = {
  _labels: Record<string, string>;
  decision: string;
  assumptions: Assumptions;
  candidates: Candidate[];
  concepts: string[];
  experiment: { days: number; spendPerCell: number; pullByArea: Record<string, Record<string, [number, number, number]>> };
  researchRungs: { id: RungId; label: string; cost: number; costNote?: string; days: number }[];
  studySpecs: unknown;
};

const E = entry as unknown as Entry;
const areas: Area[] = E.candidates.map((c) => ({ id: c.id, name: c.name, desk: c.desk }));

const bestPull = (id: string) => Math.max(...Object.values(E.experiment.pullByArea[id] ?? {}).map((v) => v[0]), 100);

/** What each information level feeds the model, per area. */
function views(): Record<RungId, Record<string, Inputs>> {
  const fromSurvey = (c: Candidate, pull: number): Inputs => ({
    burgerShare: c.survey.burgerQsrWeeklyShare,
    wouldVisit: c.survey.wouldVisitShare,
    ticket: c.survey.avgTicket,
    pull,
  });
  return {
    desk: Object.fromEntries(E.candidates.map((c) => [c.id, DESK_PRIOR])),
    survey: Object.fromEntries(E.candidates.map((c) => [c.id, fromSurvey(c, 100)])),
    survey_experiment: Object.fromEntries(E.candidates.map((c) => [c.id, fromSurvey(c, bestPull(c.id))])),
  };
}

function siteParams(pick: string | null): SiteParam[] {
  const onPick = (key: keyof Inputs, label: string, low: number, high: number): SiteParam[] =>
    pick
      ? [
          {
            id: `${key}_${pick}`,
            label,
            low,
            high,
            apply: (a, inputs, v) => ({ a, inputs: { ...inputs, [pick]: { ...inputs[pick], [key]: v } } }),
          },
        ]
      : [];
  const assumption = (key: keyof Assumptions, label: string, low: number, high: number): SiteParam => ({
    id: key,
    label,
    low,
    high,
    apply: (a, inputs, v) => ({ a: { ...a, [key]: v }, inputs }),
  });
  const v = pick ? views().survey_experiment[pick] : null;
  return [
    ...(v ? onPick("wouldVisit", "Share who say they'd visit (picked area)", Math.max(0.02, v.wouldVisit - 0.1), v.wouldVisit + 0.1) : []),
    ...(v ? onPick("pull", "In-market Pull of the winning concept (picked area)", v.pull - 30, v.pull + 30) : []),
    ...(v ? onPick("ticket", "Average ticket (picked area)", v.ticket - 1.5, v.ticket + 1.5) : []),
    assumption("sayDoBase", "How many people who say they'd come actually come", 0.35, 0.55),
    assumption("sayDoPerPullPoint", "How strongly Pull predicts behaviour", 0.002, 0.006),
    assumption("buildCost", "Build cost", 1_600_000, 2_600_000),
    assumption("contributionMargin", "Store contribution margin", 0.16, 0.24),
    assumption("competitorDrag", "How much each competitor takes", 0.04, 0.12),
    assumption("passByCapture", "Share of passing traffic that stops", 0.004, 0.008),
  ];
}

export function getMarketEntryReport() {
  const a = E.assumptions;
  const v = views();
  const levels = (["desk", "survey", "survey_experiment"] as RungId[]).map((rung) => {
    const c = choose(a, areas, v[rung]);
    return {
      rung,
      label: E.researchRungs.find((r) => r.id === rung)?.label ?? rung,
      pick: c.pick,
      areas: areas.map((ar) => ({ id: ar.id, name: ar.name, ...project(a, ar.desk, v[rung][ar.id]) })),
    };
  });
  const final = levels[levels.length - 1];
  const research = E.researchRungs.map((r) => {
    const value = r.id === "desk" ? 0 : valueOfResearch(a, areas, r.id);
    return { ...r, value, net: value - r.cost, roi: r.cost ? Math.round((value / r.cost) * 10) / 10 : null };
  });
  const concepts = E.candidates.map((c) => readConcepts(c.id, c.survey.topConcept, E.experiment.pullByArea[c.id]));
  const pickConcept = final.pick ? concepts.find((x) => x.area === final.pick) ?? null : null;
  const deskPick = levels[0].pick;
  const npvOf = (lv: (typeof levels)[number], id: string | null) => (id ? lv.areas.find((x) => x.id === id)?.npv ?? 0 : 0);

  return {
    decision: E.decision,
    labels: E._labels,
    candidates: E.candidates.map((c) => ({ id: c.id, name: c.name, zips: c.zips, story: c.story, desk: c.desk, verbatims: c.survey.verbatims })),
    levels,
    recommendation: final.pick
      ? {
          area: final.pick,
          name: areas.find((x) => x.id === final.pick)?.name,
          concept: pickConcept?.didTop ?? null,
          newProduct: pickConcept ? pickConcept.sayDoGap : false,
          projectedAnnualSales: final.areas.find((x) => x.id === final.pick)?.annualSales,
          projectedWeeklyVisits: final.areas.find((x) => x.id === final.pick)?.weeklyVisits,
          npv: npvOf(final, final.pick),
          /** NPV difference vs what desk research alone would have done (open its pick, or not open). */
          vsDeskOnly: npvOf(final, final.pick) - npvOf(final, deskPick),
          avoidedLoss: Math.min(0, ...final.areas.filter((x) => x.id !== final.pick).map((x) => x.npv)),
        }
      : null,
    concepts,
    sensitivity: siteTornado(a, areas, v.survey_experiment, siteParams(final.pick)),
    research,
    studySpecs: E.studySpecs,
  };
}

export type MarketEntryReport = ReturnType<typeof getMarketEntryReport>;

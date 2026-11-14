// All numbers shown in the UI are computed here, never by the LLM.
import type { SalesPoint, StudyResults } from "./types";

const WEEKDAYS_PER_WEEK = 5;
const avg = (xs: SalesPoint[]) => (xs.length ? xs.reduce((t, r) => t + r.sales, 0) / xs.length : 0);

/** % change of the last `recentWeeks` weeks vs the `baselineWeeks` before that (weekday lunch sales). */
export function salesChangePct(series: SalesPoint[], recentWeeks = 3, baselineWeeks = 6): number {
  const r = recentWeeks * WEEKDAYS_PER_WEEK;
  const b = baselineWeeks * WEEKDAYS_PER_WEEK;
  const recent = series.slice(-r);
  const base = series.slice(-(r + b), -r);
  if (!base.length) return 0;
  return ((avg(recent) - avg(base)) / avg(base)) * 100;
}

export type GapRow = { option: string; synthetic: number; real: number; gap: number; biggest: boolean };

/** Per-option gap in percentage points (synthetic minus real); flags the biggest miss. */
export function computeGaps(r: StudyResults): GapRow[] {
  const rows = r.options.map((option, i) => ({
    option,
    synthetic: r.synthetic[i],
    real: r.real[i],
    gap: r.synthetic[i] - r.real[i],
    biggest: false,
  }));
  const maxAbs = Math.max(...rows.map((x) => Math.abs(x.gap)));
  rows.forEach((x) => (x.biggest = Math.abs(x.gap) === maxAbs));
  return rows;
}

export const topOption = (r: StudyResults, key: "synthetic" | "real") =>
  r.options[r[key].indexOf(Math.max(...r[key]))];

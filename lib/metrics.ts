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

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const weekday = (date: string) => new Date(date + "T12:00:00Z").getUTCDay();

export type AnomalyDay = { date: string; sales: number; baseline: number; z: number };
export type AnomalyResult = { flagged: boolean; daysBelow: number; days: AnomalyDay[] };

/**
 * Anomaly rule: baseline = median of the same weekday over the prior `weeks` weeks.
 * Flag when at least 5 of the last 7 days have a robust z (MAD-based) below -2.
 * One bad day is never an anomaly.
 */
export function anomaly(series: SalesPoint[], weeks = 6): AnomalyResult {
  const withBase = series
    .map((p, i) => {
      const prior = series
        .slice(Math.max(0, i - weeks * WEEKDAYS_PER_WEEK), i)
        .filter((q) => weekday(q.date) === weekday(p.date));
      return prior.length >= 3 ? { ...p, baseline: median(prior.map((q) => q.sales)) } : null;
    })
    .filter((x): x is SalesPoint & { baseline: number } => x !== null);
  const last = withBase.slice(-7);
  // Spread is measured on history before the recent 3 weeks, so a fresh drop does not inflate its own noise estimate.
  const ref = withBase.slice(0, -15).map((d) => d.sales - d.baseline);
  const center = median(ref);
  const mad = median(ref.map((r) => Math.abs(r - center))) * 1.4826 || 1;
  const days = last.map((d) => ({
    date: d.date,
    sales: d.sales,
    baseline: d.baseline,
    z: Number(((d.sales - d.baseline - center) / mad).toFixed(2)),
  }));
  const daysBelow = days.filter((d) => d.z < -2).length;
  return { flagged: daysBelow >= 5, daysBelow, days };
}

/** Store's change minus the average change of comparison stores (percentage points). */
export function comparisonGapPts(storeChangePct: number, otherChangesPct: number[]): number {
  if (!otherChangesPct.length) return 0;
  return storeChangePct - otherChangesPct.reduce((a, b) => a + b, 0) / otherChangesPct.length;
}

export type VisitsVsSpend = { visitsPct: number; ticketPct: number; salesPct: number };

/** ln(sales) = ln(visits) + ln(avg ticket): the two parts add up exactly (in log points, reported as %). */
export function visitsVsSpend(traffic: { visits: number; avgTicket: number }[], recentWeeks = 3, baselineWeeks = 6): VisitsVsSpend | null {
  const r = recentWeeks * WEEKDAYS_PER_WEEK;
  const b = baselineWeeks * WEEKDAYS_PER_WEEK;
  const recent = traffic.slice(-r);
  const base = traffic.slice(-(r + b), -r);
  if (!recent.length || !base.length) return null;
  const mean = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length;
  const visits = Math.log(mean(recent.map((t) => t.visits)) / mean(base.map((t) => t.visits))) * 100;
  const ticket = Math.log(mean(recent.map((t) => t.avgTicket)) / mean(base.map((t) => t.avgTicket))) * 100;
  return { visitsPct: visits, ticketPct: ticket, salesPct: visits + ticket };
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

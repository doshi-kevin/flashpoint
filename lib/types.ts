// Shared types for Economic Pulse.
export type Store = { id: string; name: string; chain: string; area: string };
export type SalesPoint = { date: string; sales: number };
export type StoreEvent = { date: string; type: "rain" | "roadworks" | "competitor"; label: string };
export type SignalLabel = "Observed" | "Inferred" | "Unknown";
export type Signal = { id: string; source: string; text: string; label: SignalLabel };
export type HypothesisStatus =
  | "Strongly supported"
  | "Plausible"
  | "Weak"
  | "Contradicted"
  | "Insufficient info";
export type Hypothesis = {
  claim: string;
  supporting: string[];
  counter: string[];
  status: HypothesisStatus;
  /** Added by the Challenger agent (optional). */
  challenge?: string;
};
export type VerdictLabel = "temporary" | "structural" | "unclear";
export type Verdict = { label: VerdictLabel; reason: string };
export type Challenge = { claim: string; challenge: string; newStatus: HypothesisStatus };
export type TraceStep = { step: string; detail: string; source: string };
export type Investigation = {
  hypotheses: Hypothesis[];
  unknown: string;
  question: { text: string; options: string[] };
  rationale: string;
  /** Optional additions (all computed server-side). */
  verdict?: Verdict;
  challenges?: Challenge[];
  trace?: TraceStep[];
};
export type TrafficPoint = { date: string; visits: number; avgTicket: number };
export type StudyVerdict = {
  strength: "Strongly supported" | "Plausible" | "Insufficient info";
  predictionHeld: boolean;
  realTop: string;
  syntheticTop: string;
};
export type StudyResults = {
  question: string;
  options: string[];
  synthetic: number[]; // % per option
  real: number[]; // % per option
  sampleSize: number;
};
export type Decision = {
  before: { title: string; why: string };
  after: { title: string; why: string };
  owner: string;
  metric: string;
  reviewDate: string;
};

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
export type Hypothesis = { claim: string; supporting: string[]; counter: string[]; status: HypothesisStatus };
export type Investigation = {
  hypotheses: Hypothesis[];
  unknown: string;
  question: { text: string; options: string[] };
  rationale: string;
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

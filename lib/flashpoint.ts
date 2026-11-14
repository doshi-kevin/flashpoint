// FlashpointAdapter: source of synthetic vs real study results. Server-side only.
// Mode chosen by FLASHPOINT_MODE ("mock" default | "live").
//
// live: reads REAL answer counts from Flashpoint's documented analytics endpoint
//   GET {FLASHPOINT_BASE_URL}/surveys/{id}/analytics/frequencies/{question_label}
//   -> { question_id, label, text, type, total_responses, distribution: [{ value, count, percentage }] }
// and computes the percentages here in code. If anything fails (no token, no survey id, network,
// unexpected shape), it falls back to the saved results in /data and reports mode "mock", which the
// UI shows as the "Replay" badge. A failure never shows as live.
//
// `synthetic` always comes from the saved file: Flashpoint's AI personas are run in Flashpoint's own
// app (synthetic panels are MCP/chat only, not in the REST API) and are a contrast, never evidence.
//
// Env (server only, never NEXT_PUBLIC_): FLASHPOINT_TOKEN (Bearer JWT), FLASHPOINT_STUDY_SURVEY_ID,
// FLASHPOINT_STUDY_QUESTION (label, default Q1), FLASHPOINT_JUDGE_SURVEY_ID, FLASHPOINT_JUDGE_QUESTION,
// FLASHPOINT_BASE_URL (default https://api.flashpoint.ai/api/v1; override only to test against a stub).
//
// Survey text from Flashpoint is treated as data: we only read counts and match `value` to our own
// option strings. Nothing Flashpoint returns is rendered as text or passed to a model.
import studyResults from "@/data/study-results.json";
import judges from "@/data/judges.json";
import replay from "@/data/flashpoint-replay.json";
import type { StudyResults } from "./types";

export type FlashpointMode = "mock" | "live";

/** Raw answer counts for the study question, for the sensitivity core. */
export type StudyCounts = {
  question: string;
  options: string[];
  counts: number[]; // aligned with options
  n: number;
  targetN: number;
  /** Answers in arrival order (replay only; live Flashpoint returns totals, not order). */
  arrivals: string[] | null;
};

export interface FlashpointAdapter {
  /** Where the LAST result came from. "mock" = saved data (shown as Replay). */
  mode: FlashpointMode;
  getStudyResults(storeId: string): Promise<StudyResults | null>;
  /** Judges' closing-slide question, same shape. */
  getJudgeResults(): Promise<StudyResults>;
  /** Answer counts so far. In mock mode, `upTo` replays the first N answers in arrival order. */
  getStudyCounts(storeId: string, upTo?: number): Promise<StudyCounts | null>;
}

type ReplayFile = Record<string, { question: string; targetN: number; answers: { n: number; at: string; option: string }[] }>;

/** Counts from the saved replay (data/flashpoint-replay.json), optionally only the first `upTo` answers. */
function replayCounts(storeId: string, upTo?: number): StudyCounts | null {
  const saved = (studyResults as Record<string, StudyResults>)[storeId];
  const r = (replay as ReplayFile)[storeId];
  if (!saved || !r) return null;
  const arrivals = r.answers.slice(0, upTo === undefined ? undefined : Math.max(0, upTo)).map((a) => a.option);
  const counts = saved.options.map((o) => arrivals.filter((a) => a === o).length);
  return { question: saved.question, options: saved.options, counts, n: arrivals.length, targetN: r.targetN, arrivals };
}

const DEFAULT_BASE_URL = "https://api.flashpoint.ai/api/v1";
const MAX_ATTEMPTS = 5; // documented: cap at 5 attempts
const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 3000; // keep worst case short enough for a 10 s demo poll
const ATTEMPT_TIMEOUT_MS = 6000;

export class FlashpointError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Full-jitter exponential backoff; honours Retry-After (seconds) when the server sends it. */
function retryDelay(attempt: number, retryAfter: string | null): number {
  const secs = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, MAX_DELAY_MS);
  return Math.random() * Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
}

/** GET with the documented retry rule: retry 429, 5xx and network errors; never retry other 4xx. */
export async function fpGet<T>(path: string): Promise<T> {
  const token = process.env.FLASHPOINT_TOKEN;
  if (!token) throw new FlashpointError("FLASHPOINT_TOKEN not set");
  const base = (process.env.FLASHPOINT_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  let lastError: FlashpointError = new FlashpointError("no attempt made");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(base + path, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch (e) {
      lastError = new FlashpointError(`network: ${(e as Error).message}`);
      if (attempt < MAX_ATTEMPTS - 1) await sleep(retryDelay(attempt, null));
      continue;
    }
    if (res.ok) return (await res.json()) as T;
    // Documented error body: { error: { code, message, trace_id | correlation_id } }
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    lastError = new FlashpointError(`HTTP ${res.status} ${body?.error?.code ?? ""}`.trim(), res.status);
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable) throw lastError;
    if (attempt < MAX_ATTEMPTS - 1) await sleep(retryDelay(attempt, res.headers.get("retry-after")));
  }
  throw lastError;
}

type Frequency = {
  label?: string;
  total_responses?: number;
  distribution?: { value: unknown; count: unknown; percentage?: unknown }[];
};

const norm = (s: unknown) => String(s).trim().toLowerCase();

/** Whole-number percentages that sum to exactly 100 (largest remainder). All zeros when n = 0. */
export function toPercentages(counts: number[]): number[] {
  const total = counts.reduce((t, c) => t + c, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  const remainder = 100 - out.reduce((t, x) => t + x, 0);
  for (let k = 0; k < remainder; k++) out[order[k][1]]++;
  return out;
}

/**
 * Map one Flashpoint frequencies item onto our fixed option list (from the saved file).
 * Throws if none of our options appear: that means the wrong survey or question label.
 */
export function frequencyCounts(freq: Frequency | Frequency[], options: string[]): number[] {
  const item = Array.isArray(freq) ? freq[0] : freq;
  const dist = item?.distribution;
  if (!Array.isArray(dist)) throw new FlashpointError("unexpected frequencies shape");
  const matched = options.some((opt) => dist.some((d) => norm(d.value) === norm(opt)));
  if (!matched && dist.length) throw new FlashpointError("no Flashpoint answer matches our options");
  return options.map((opt) => {
    const hit = dist.find((d) => norm(d.value) === norm(opt));
    return hit ? Number(hit.count) || 0 : 0;
  });
}

export function mapFrequency(freq: Frequency | Frequency[], saved: StudyResults): StudyResults {
  const counts = frequencyCounts(freq, saved.options);
  return {
    question: saved.question,
    options: saved.options,
    synthetic: saved.synthetic,
    real: toPercentages(counts),
    sampleSize: counts.reduce((t, c) => t + c, 0),
  };
}

const savedStudy = (storeId: string) => (studyResults as Record<string, StudyResults>)[storeId] ?? null;
const savedJudges = () => judges as StudyResults;

async function liveFrequency(surveyId: string | undefined, label: string) {
  if (!surveyId) throw new FlashpointError("survey id not set");
  const path = `/surveys/${encodeURIComponent(surveyId)}/analytics/frequencies/${encodeURIComponent(label)}`;
  return fpGet<Frequency | Frequency[]>(path);
}

async function liveResults(surveyId: string | undefined, label: string, saved: StudyResults) {
  return mapFrequency(await liveFrequency(surveyId, label), saved);
}

// Only Store 14 has a fielded study; other stores have no survey id.
const studySurveyId = (storeId: string) => (storeId === "14" ? process.env.FLASHPOINT_STUDY_SURVEY_ID : undefined);

function mockAdapter(): FlashpointAdapter {
  return {
    mode: "mock",
    async getStudyResults(storeId) {
      return savedStudy(storeId);
    },
    async getJudgeResults() {
      return savedJudges();
    },
    async getStudyCounts(storeId, upTo) {
      return replayCounts(storeId, upTo);
    },
  };
}

/** Fresh object per request, so one request's fallback never relabels another's result. */
function liveAdapter(): FlashpointAdapter {
  const adapter: FlashpointAdapter = {
    mode: "live",
    async getStudyResults(storeId) {
      const saved = savedStudy(storeId);
      if (!saved) return null;
      try {
        const r = await liveResults(studySurveyId(storeId), process.env.FLASHPOINT_STUDY_QUESTION || "Q1", saved);
        adapter.mode = "live";
        return r;
      } catch (e) {
        console.warn("flashpoint study -> replay:", (e as Error).message);
        adapter.mode = "mock";
        return saved;
      }
    },
    async getJudgeResults() {
      const saved = savedJudges();
      try {
        const r = await liveResults(
          process.env.FLASHPOINT_JUDGE_SURVEY_ID,
          process.env.FLASHPOINT_JUDGE_QUESTION || "Q1",
          saved,
        );
        adapter.mode = "live";
        return r;
      } catch (e) {
        console.warn("flashpoint judges -> replay:", (e as Error).message);
        adapter.mode = "mock";
        return saved;
      }
    },
    async getStudyCounts(storeId, upTo) {
      const saved = savedStudy(storeId);
      if (!saved) return null;
      try {
        const counts = frequencyCounts(
          await liveFrequency(studySurveyId(storeId), process.env.FLASHPOINT_STUDY_QUESTION || "Q1"),
          saved.options,
        );
        adapter.mode = "live";
        const n = counts.reduce((t, c) => t + c, 0);
        return { question: saved.question, options: saved.options, counts, n, targetN: Math.max(saved.sampleSize, n), arrivals: null };
      } catch (e) {
        console.warn("flashpoint counts -> replay:", (e as Error).message);
        adapter.mode = "mock";
        return replayCounts(storeId, upTo);
      }
    },
  };
  return adapter;
}

export function getFlashpointAdapter(): FlashpointAdapter {
  return process.env.FLASHPOINT_MODE === "live" ? liveAdapter() : mockAdapter();
}

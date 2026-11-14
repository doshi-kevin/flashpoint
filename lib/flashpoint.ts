// FlashpointAdapter: source of synthetic vs real study results.
// Mode chosen by FLASHPOINT_MODE ("mock" default | "live").
import studyResults from "@/data/study-results.json";
import type { StudyResults } from "./types";

export interface FlashpointAdapter {
  mode: "mock" | "live";
  getStudyResults(storeId: string): Promise<StudyResults | null>;
}

const mockAdapter: FlashpointAdapter = {
  mode: "mock",
  async getStudyResults(storeId) {
    return (studyResults as Record<string, StudyResults>)[storeId] ?? null;
  },
};

const liveAdapter: FlashpointAdapter = {
  mode: "live",
  async getStudyResults() {
    // TODO: POST the chosen question + 3 options to the Flashpoint.AI study endpoint.
    // TODO: poll/await real respondent results; map them to StudyResults.real (% per option).
    // TODO: request the synthetic-customer prediction and map to StudyResults.synthetic.
    // TODO: authenticate with a FLASHPOINT_API_KEY env var (not yet defined).
    throw new Error("Flashpoint live mode not implemented");
  },
};

export function getFlashpointAdapter(): FlashpointAdapter {
  return process.env.FLASHPOINT_MODE === "live" ? liveAdapter : mockAdapter;
}

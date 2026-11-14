// Server-side loaders for hardcoded JSON in /data.
import stores from "@/data/stores.json";
import sales from "@/data/sales.json";
import events from "@/data/events.json";
import signals from "@/data/signals.json";
import decisions from "@/data/decisions.json";
import judges from "@/data/judges.json";
import fallback from "@/data/fallback-investigation.json";
import { readFileSync } from "fs";
import { join } from "path";
import type { Store, SalesPoint, StoreEvent, Signal, Decision, StudyResults, Investigation, TrafficPoint } from "./types";

export const getStores = () => stores as Store[];
export const getStore = (id: string) => getStores().find((s) => s.id === id);
export const getSales = (id: string) => (sales as Record<string, SalesPoint[]>)[id] ?? [];
export const getEvents = (id: string) => (events as Record<string, StoreEvent[]>)[id] ?? [];
export const getSignals = (id: string) => (signals as Record<string, Signal[]>)[id] ?? [];
export const getDecision = (id: string) => (decisions as Record<string, Decision>)[id];
export const getJudges = () => judges as StudyResults;
/** Optional per-day visits and ticket (Adi supplies data/traffic.json). Empty until the file exists. */
export function getTraffic(id: string): TrafficPoint[] {
  try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), "data", "traffic.json"), "utf8"));
    return (raw[id] as TrafficPoint[]) ?? [];
  } catch {
    return [];
  }
}
export const getFallbackInvestigation = () => fallback as Investigation;

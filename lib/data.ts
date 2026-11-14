// Server-side loaders for hardcoded JSON in /data.
import stores from "@/data/stores.json";
import sales from "@/data/sales.json";
import events from "@/data/events.json";
import signals from "@/data/signals.json";
import decisions from "@/data/decisions.json";
import judges from "@/data/judges.json";
import fallback from "@/data/fallback-investigation.json";
import type { Store, SalesPoint, StoreEvent, Signal, Decision, StudyResults, Investigation } from "./types";

export const getStores = () => stores as Store[];
export const getStore = (id: string) => getStores().find((s) => s.id === id);
export const getSales = (id: string) => (sales as Record<string, SalesPoint[]>)[id] ?? [];
export const getEvents = (id: string) => (events as Record<string, StoreEvent[]>)[id] ?? [];
export const getSignals = (id: string) => (signals as Record<string, Signal[]>)[id] ?? [];
export const getDecision = (id: string) => (decisions as Record<string, Decision>)[id];
export const getJudges = () => judges as StudyResults;
export const getFallbackInvestigation = () => fallback as Investigation;

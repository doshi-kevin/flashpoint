// Key numbers (computed in code) and the sales chart for a case's store.
// Props: facts ({weekdayLunchSalesChangePct, comparisonStoresAvgChangePct, anomaly}), sales, events.
import SalesChart from "./SalesChart";
import SampleBadge from "./SampleBadge";
import AgentTag from "./AgentTag";
import Badge from "./Badge";
import type { SalesPoint, StoreEvent } from "@/lib/types";

export type Facts = {
  weekdayLunchSalesChangePct: number;
  comparisonStoresAvgChangePct: number;
  anomaly: { flagged: boolean; daysBelowBaselineOfLast7?: number };
  gapVsComparisonPts?: number;
  visitsVsSpend?: { visitsPct: number; ticketPct: number } | null;
};

export const sign = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function CaseFacts({ facts, sales, events }: { facts: Facts; sales: SalesPoint[]; events: StoreEvent[] }) {
  return (
    <div className="rounded-md border border-line bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <p className="label">Weekday lunch sales</p>
        <div className="flex items-center gap-2">
          <AgentTag agent="Code" />
          <SampleBadge />
        </div>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-3">
        <div>
          <p className="label">This store</p>
          <p className="tabular font-mono text-4xl font-medium leading-tight text-crimson">{sign(facts.weekdayLunchSalesChangePct)}</p>
          <p className="text-xs text-muted">last 3 weeks vs prior 6</p>
        </div>
        <div>
          <p className="label">Other stores</p>
          <p className="tabular font-mono text-4xl font-medium leading-tight">{sign(facts.comparisonStoresAvgChangePct)}</p>
          <p className="text-xs text-muted">same period, average</p>
        </div>
        <div>
          <p className="label">Anomaly rule</p>
          <p className="mt-2">
            <Badge tone={facts.anomaly.flagged ? "bad" : "good"}>
              <span aria-hidden>{facts.anomaly.flagged ? "●" : "✓"}</span> {facts.anomaly.flagged ? "Outside normal" : "Within normal"}
            </Badge>
          </p>
        </div>
      </div>
      <div className="border-t border-line p-4">
        <SalesChart data={sales} events={events} />
      </div>
    </div>
  );
}

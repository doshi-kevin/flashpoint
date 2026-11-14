// Key numbers (computed in code) and the sales chart for a case's store.
// Props: facts ({weekdayLunchSalesChangePct, comparisonStoresAvgChangePct, anomaly}), sales, events.
import SalesChart from "./SalesChart";
import SampleBadge from "./SampleBadge";
import Badge from "./Badge";
import type { SalesPoint, StoreEvent } from "@/lib/types";

export type Facts = {
  weekdayLunchSalesChangePct: number;
  comparisonStoresAvgChangePct: number;
  anomaly: { flagged: boolean };
};

export const sign = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function CaseFacts({ facts, sales, events }: { facts: Facts; sales: SalesPoint[]; events: StoreEvent[] }) {
  return (
    <div className="rounded border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="label">Weekday lunch sales</p>
        <SampleBadge />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <div>
          <p className="label">This store</p>
          <p className="text-2xl font-semibold text-accent-ink">{sign(facts.weekdayLunchSalesChangePct)}</p>
          <p className="text-xs text-muted">last 3 weeks vs prior 6</p>
        </div>
        <div>
          <p className="label">Other stores</p>
          <p className="text-2xl font-semibold">{sign(facts.comparisonStoresAvgChangePct)}</p>
          <p className="text-xs text-muted">same period, average</p>
        </div>
        <div>
          <p className="label">Anomaly rule</p>
          <p className="mt-1">
            <Badge tone={facts.anomaly.flagged ? "bad" : "good"}>
              {facts.anomaly.flagged ? "Outside normal" : "Within normal"}
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

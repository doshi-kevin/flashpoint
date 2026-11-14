// The case file for a matched store: key numbers (computed in code) and the sales chart.
// Props: storeName, facts ({weekdayLunchSalesChangePct, comparisonStoresAvgChangePct, anomaly}), sales, events.
import SalesChart from "./SalesChart";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { SalesPoint, StoreEvent } from "@/lib/types";

export type Facts = {
  weekdayLunchSalesChangePct: number;
  comparisonStoresAvgChangePct: number;
  anomaly: { flagged: boolean };
};

const sign = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function CaseFacts({
  storeName,
  facts,
  sales,
  events,
}: {
  storeName: string;
  facts: Facts;
  sales: SalesPoint[];
  events: StoreEvent[];
}) {
  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">
          {copy.case.title} · {storeName}
        </p>
        <SampleBadge />
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="font-serif text-5xl font-semibold leading-none text-accent-ink">
            {sign(facts.weekdayLunchSalesChangePct)}
          </p>
          <p className="mt-1 text-sm text-muted">{copy.case.change}</p>
        </div>
        <div>
          <p className="font-serif text-5xl font-semibold leading-none">{sign(facts.comparisonStoresAvgChangePct)}</p>
          <p className="mt-1 text-sm text-muted">{copy.case.others}</p>
        </div>
        <div className="flex items-end">
          <p className="text-sm font-medium">{facts.anomaly.flagged ? copy.case.normal : copy.case.inRange}</p>
        </div>
      </div>
      <div className="mt-4">
        <SalesChart data={sales} events={events} />
      </div>
    </section>
  );
}

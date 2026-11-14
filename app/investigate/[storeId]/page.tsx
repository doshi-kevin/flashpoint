// Screen 2: Investigation workspace (chart, public signals, hypotheses via /api/investigate).
export const instant = false; // blocking route (Next 16 cache components): params are read at request time

import { notFound } from "next/navigation";
import SalesChart from "@/components/SalesChart";
import SignalsPanel from "@/components/SignalsPanel";
import InvestigationWorkspace from "@/components/InvestigationWorkspace";
import SampleBadge from "@/components/SampleBadge";
import { getStore, getSales, getEvents, getSignals } from "@/lib/data";
import { salesChangePct } from "@/lib/metrics";
import { copy } from "@/content/copy";

export default async function InvestigatePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = getStore(storeId);
  if (!store) notFound();
  const sales = getSales(storeId);
  const change = salesChangePct(sales);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {copy.investigate.title}: {store.name} <span className="text-red-600">({change.toFixed(1)}%)</span>
      </h1>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-semibold">{copy.investigate.chart}</h3>
          <SampleBadge />
        </div>
        <SalesChart data={sales} events={getEvents(storeId)} />
      </section>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <SignalsPanel signals={getSignals(storeId)} />
        </div>
        <div className="md:col-span-2">
          <InvestigationWorkspace storeId={storeId} />
        </div>
      </div>
    </div>
  );
}

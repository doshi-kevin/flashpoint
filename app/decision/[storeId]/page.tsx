// Screen 4: Decision card (before vs after, owner, metric, review date).
export const instant = false; // blocking route (Next 16 cache components): params are read at request time

import { notFound } from "next/navigation";
import DecisionCard from "@/components/DecisionCard";
import SampleBadge from "@/components/SampleBadge";
import { getStore, getDecision } from "@/lib/data";
import { copy } from "@/content/copy";

export default async function DecisionPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = getStore(storeId);
  const decision = getDecision(storeId);
  if (!store || !decision) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">
          {copy.decision.title}: {store.name}
        </h1>
        <SampleBadge />
      </div>
      <DecisionCard decision={decision} />
    </div>
  );
}

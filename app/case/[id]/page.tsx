// Case detail for a store-based case (e.g. /case/14). The case file is computed on the server.
export const instant = false; // blocking route (Next 16 cache components): params are read at request time

import { Suspense } from "react";
import { notFound } from "next/navigation";
import CaseView from "@/components/CaseView";
import { caseFile } from "@/lib/investigate";
import { sign } from "@/components/CaseFacts";
import { getStores } from "@/lib/data";

// Pre-render every store case (needed for the static GitHub Pages build; harmless otherwise).
export function generateStaticParams() {
  return getStores().map((s) => ({ id: s.id }));
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cf = caseFile(id);
  if (!cf) notFound();
  const change = cf.facts.weekdayLunchSalesChangePct;
  return (
    <Suspense fallback={null}>
    <CaseView
      caseKey={`EP-${id}`}
      title={`Weekday lunch sales ${sign(change)} at ${cf.store.name}`}
      problem={`${cf.store.name}'s weekday lunch sales are ${sign(change)} over the last 3 weeks vs the prior 6. Why?`}
      initialStoreId={id}
      initialCase={cf}
    />
    </Suspense>
  );
}

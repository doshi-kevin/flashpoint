// Screen 3: The study (question, synthetic vs real, gap). Data comes from /api/study via StudyView.
export const instant = false; // blocking route (Next 16 cache components): params are read at request time

import { notFound } from "next/navigation";
import StudyView from "@/components/StudyView";
import { getStore } from "@/lib/data";
import { copy } from "@/content/copy";

export default async function StudyPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = getStore(storeId);
  if (!store) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {copy.study.title}: {store.name}
      </h1>
      <StudyView storeId={storeId} />
    </div>
  );
}

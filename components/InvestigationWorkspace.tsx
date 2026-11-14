"use client";
// Interactive half of the investigation page: Investigate button + results.
// Props: storeId. Calls POST /api/investigate. Holds only fetch state, no styling logic.
import { useState } from "react";
import Link from "next/link";
import HypothesisCard from "./HypothesisCard";
import UnknownCallout from "./UnknownCallout";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { Investigation } from "@/lib/types";

export default function InvestigationWorkspace({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ result: Investigation; source: "claude" | "fallback" } | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold">{copy.investigate.hypotheses}</h3>
        <button onClick={run} disabled={loading} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {loading ? copy.investigate.running : copy.investigate.button}
        </button>
        {data?.source === "fallback" && <SampleBadge kind="replay" />}
      </div>
      {!data && <p className="text-sm text-gray-500">{copy.investigate.idle}</p>}
      {data && (
        <>
          {data.source === "fallback" && <p className="text-xs text-gray-500">{copy.investigate.fallbackNote}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {data.result.hypotheses.map((h, i) => (
              <HypothesisCard key={i} hypothesis={h} />
            ))}
          </div>
          <UnknownCallout text={data.result.unknown} />
          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">{copy.investigate.questionTitle}</h3>
            <p className="my-2 text-lg">{data.result.question.text}</p>
            <ul className="mb-2 flex gap-2 text-sm">
              {data.result.question.options.map((o) => (
                <li key={o} className="rounded border border-gray-300 px-2 py-1">
                  {o}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600">
              <strong>{copy.investigate.rationale}:</strong> {data.result.rationale}
            </p>
            <Link href={`/study/${storeId}`} className="mt-3 inline-block text-sm font-medium underline">
              {copy.investigate.toStudy}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

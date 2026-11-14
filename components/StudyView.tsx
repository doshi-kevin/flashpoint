"use client";
// Study screen body. Props: storeId. Fetches GET /api/study/[storeId], shows the question with
// 3 tap-able choices, the two result columns and the gap indicator. Fetch/selection logic only.
import { useEffect, useState } from "react";
import Link from "next/link";
import ResultColumn from "./ResultColumn";
import GapIndicator from "./GapIndicator";
import SampleBadge from "./SampleBadge";
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

export default function StudyView({ storeId }: { storeId: string }) {
  const [state, setState] = useState<{ mode: string; results: StudyResults } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/study/${storeId}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then(setState)
      .catch((e) => setError(String(e)));
  }, [storeId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!state) return <p className="text-gray-500">Loading…</p>;
  const { results, mode } = state;
  const gaps = computeGaps(results);
  const syntheticTop = results.options.indexOf(topOption(results, "synthetic"));
  const realTop = results.options.indexOf(topOption(results, "real"));

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xl font-semibold">{results.question}</h2>
          {mode === "mock" && <SampleBadge kind="replay" />}
        </div>
        <p className="mb-2 text-sm text-gray-500">{copy.study.pickPrompt}</p>
        <div className="flex gap-3">
          {results.options.map((o) => (
            <button
              key={o}
              onClick={() => setPicked(o)}
              className={`rounded border px-4 py-3 ${picked === o ? "border-black bg-black text-white" : "border-gray-300"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ResultColumn title={copy.study.synthetic} options={results.options} values={results.synthetic} highlightIndex={syntheticTop} />
        <ResultColumn title={copy.study.real} options={results.options} values={results.real} highlightIndex={realTop} />
        <GapIndicator rows={gaps} />
      </div>
      <p className="text-sm text-gray-500">
        n = {results.sampleSize} {copy.study.sample}
      </p>
      <Link href={`/decision/${storeId}`} className="inline-block text-sm font-medium underline">
        {copy.study.toDecision}
      </Link>
    </div>
  );
}

"use client";
// Study results table: AI predicted (grey, hatched) vs real people (lime), with the gap per answer.
// Props: results (StudyResults). Gap math comes from lib/metrics (computed in code).
import { useEffect, useState } from "react";
import Badge from "./Badge";
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

function Cell({ value, on, real }: { value: number; on: boolean; real?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-3 w-28 overflow-hidden rounded-sm bg-line sm:w-36" role="img" aria-label={`${value}%`}>
        <div
          className={`h-3 transition-[width] duration-700 ease-out ${real ? "bg-lime ring-1 ring-inset ring-ink/40" : "hatch"}`}
          style={{ width: on ? `${value}%` : "0%" }}
        />
      </div>
      <span className="w-10 font-mono text-xs">{value}%</span>
    </div>
  );
}

export default function StudyCompare({ results }: { results: StudyResults }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = computeGaps(results);
  return (
    <div className="space-y-3">
      <p className="text-xl font-extrabold leading-snug">
        {copy.study.headline(topOption(results, "synthetic"), topOption(results, "real"))}
      </p>
      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="label border-b border-line bg-soft/60">
            <tr>
              <th className="px-4 py-2.5 font-medium">{copy.study.cols.option}</th>
              <th className="px-4 py-2.5 font-medium">
                <Badge tone="synthetic">{copy.study.cols.predicted}</Badge>
              </th>
              <th className="px-4 py-2.5 font-medium">
                <Badge tone="real">{copy.study.cols.real}</Badge>
              </th>
              <th className="px-4 py-2.5 font-medium">{copy.study.cols.gap}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.option} className={r.biggest ? "bg-crimson-soft/50" : ""}>
                <td className="px-4 py-3.5 font-semibold">{r.option}</td>
                <td className="px-4 py-3.5">
                  <Cell value={r.synthetic} on={on} />
                </td>
                <td className="px-4 py-3.5">
                  <Cell value={r.real} on={on} real />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className={`mr-2 font-mono text-xs ${r.biggest ? "font-medium text-crimson" : ""}`}>
                    {r.gap > 0 ? "+" : ""}
                    {r.gap} pts
                  </span>
                  {r.biggest && (
                    <Badge tone="bad">
                      <span aria-hidden>✕</span> {copy.study.miss}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-xs text-muted">
        n = {results.sampleSize} {copy.study.respondents}
      </p>
    </div>
  );
}

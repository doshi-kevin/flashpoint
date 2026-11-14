"use client";
// Study results table: AI predicted vs real people, with the gap per answer (animated bars).
// Props: results (StudyResults). Gap math comes from lib/metrics (computed in code).
import { useEffect, useState } from "react";
import Badge from "./Badge";
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

function Cell({ value, on, color }: { value: number; on: boolean; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded bg-soft">
        <div
          className={`h-2 rounded transition-[width] duration-700 ease-out ${color}`}
          style={{ width: on ? `${value}%` : "0%" }}
        />
      </div>
      <span className="w-9 font-mono text-xs">{value}%</span>
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
      <p className="text-base font-semibold">
        {copy.study.headline(topOption(results, "synthetic"), topOption(results, "real"))}
      </p>
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="label border-b border-line">
            <tr>
              <th className="px-4 py-2 font-semibold">{copy.study.cols.option}</th>
              <th className="px-4 py-2 font-semibold">{copy.study.cols.predicted}</th>
              <th className="px-4 py-2 font-semibold">{copy.study.cols.real}</th>
              <th className="px-4 py-2 font-semibold">{copy.study.cols.gap}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.option} className={r.biggest ? "bg-[#fff8f5]" : ""}>
                <td className="px-4 py-3 font-medium">{r.option}</td>
                <td className="px-4 py-3">
                  <Cell value={r.synthetic} on={on} color="bg-muted/60" />
                </td>
                <td className="px-4 py-3">
                  <Cell value={r.real} on={on} color="bg-accent" />
                </td>
                <td className="px-4 py-3">
                  <span className="mr-2 font-mono text-xs">
                    {r.gap > 0 ? "+" : ""}
                    {r.gap} pts
                  </span>
                  {r.biggest && <Badge tone="bad">{copy.study.miss}</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        n = {results.sampleSize} {copy.study.respondents}
      </p>
    </div>
  );
}

"use client";
// "AI predicted" vs "Real people said", one pair of bars per option (animated in), plus the biggest miss.
// Props: results (StudyResults). Gap math comes from lib/metrics (computed in code).
import { useEffect, useState } from "react";
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

export default function StudyCompare({ results }: { results: StudyResults }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = computeGaps(results);
  const miss = rows.find((r) => r.biggest);
  return (
    <div className="space-y-5">
      <p className="font-serif text-2xl leading-snug">
        {copy.ask.headline(topOption(results, "synthetic"), topOption(results, "real"))}
      </p>
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.option}>
            <p className="mb-1 text-sm font-medium">{r.option}</p>
            <div className="space-y-1.5">
              {[
                { label: copy.ask.predicted, value: r.synthetic, color: "bg-muted/60" },
                { label: copy.ask.real, value: r.real, color: "bg-accent" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-muted">{b.label}</span>
                  <div className="h-3 flex-1 rounded bg-line">
                    <div
                      className={`h-3 rounded transition-[width] duration-700 ease-out ${b.color}`}
                      style={{ width: on ? `${b.value}%` : "0%" }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono">{b.value}%</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {miss && <p className="text-sm font-semibold text-accent">{copy.ask.miss(miss.option, Math.abs(miss.gap))}</p>}
      <p className="text-xs text-muted">
        n = {results.sampleSize} {copy.ask.respondents}
      </p>
    </div>
  );
}

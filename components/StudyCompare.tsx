// "AI predicted" vs "Real people said", one pair of bars per option, plus the biggest miss.
// Props: results (StudyResults). Gap math comes from lib/metrics (computed in code).
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

export default function StudyCompare({ results }: { results: StudyResults }) {
  const rows = computeGaps(results);
  const miss = rows.find((r) => r.biggest);
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">
        {copy.ask.headline(topOption(results, "synthetic"), topOption(results, "real"))}
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.option}>
            <p className="mb-1 text-sm font-medium">{r.option}</p>
            <div className="space-y-1">
              {[
                { label: copy.ask.predicted, value: r.synthetic, color: "bg-gray-400" },
                { label: copy.ask.real, value: r.real, color: "bg-black" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-gray-500">{b.label}</span>
                  <div className="h-3 flex-1 rounded bg-gray-100">
                    <div className={`h-3 rounded ${b.color}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-9 text-right font-mono">{b.value}%</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {miss && <p className="text-sm font-semibold text-red-700">{copy.ask.miss(miss.option, Math.abs(miss.gap))}</p>}
      <p className="text-xs text-gray-500">
        n = {results.sampleSize} {copy.ask.respondents}
      </p>
    </div>
  );
}

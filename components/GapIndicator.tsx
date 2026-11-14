// Shows prediction-vs-reality gap per option. Props: rows (GapRow[] from lib/metrics computeGaps).
import Badge from "./Badge";
import { copy } from "@/content/copy";
import type { GapRow } from "@/lib/metrics";

export default function GapIndicator({ rows }: { rows: GapRow[] }) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold">{copy.study.gap}</h3>
      <ul className="space-y-3 text-sm">
        {rows.map((r) => (
          <li key={r.option} className="flex items-center justify-between gap-2">
            <span>{r.option}</span>
            <span className="flex items-center gap-2">
              {r.biggest && <Badge tone="bad">{copy.study.biggestMiss}</Badge>}
              <span className={`font-mono ${r.biggest ? "font-bold text-red-600" : ""}`}>
                {r.gap > 0 ? "+" : ""}
                {r.gap} {copy.study.pp}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

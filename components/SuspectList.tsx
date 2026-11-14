// Suspects as a table: hypothesis + status lozenge; click a row for evidence for/against and the Challenger's note.
// Props: hypotheses (Hypothesis[]). Status is always words, never colour alone.
import Badge from "./Badge";
import { copy } from "@/content/copy";
import type { Hypothesis, HypothesisStatus } from "@/lib/types";

const rank: Record<HypothesisStatus, number> = {
  "Strongly supported": 0,
  Plausible: 1,
  "Insufficient info": 2,
  Weak: 3,
  Contradicted: 4,
};
const tone: Record<HypothesisStatus, "good" | "warn" | "bad" | "neutral"> = {
  "Strongly supported": "good",
  Plausible: "warn",
  "Insufficient info": "neutral",
  Weak: "neutral",
  Contradicted: "bad",
};

export default function SuspectList({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const sorted = [...hypotheses].sort((a, b) => rank[a.status] - rank[b.status]);
  return (
    <div className="rounded border border-line bg-panel">
      <div className="label flex justify-between border-b border-line px-4 py-2">
        <span>{copy.investigation.cols.hypothesis}</span>
        <span>{copy.investigation.cols.status}</span>
      </div>
      <ul className="divide-y divide-line">
        {sorted.map((h) => (
          <li key={h.claim}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 hover:bg-soft">
                <span className="font-medium">{h.claim}</span>
                <Badge tone={tone[h.status]}>{h.status}</Badge>
              </summary>
              <div className="grid gap-3 border-t border-line bg-bg px-4 py-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="label mb-1">{copy.investigation.evidenceFor}</p>
                  <ul className="list-disc pl-4 text-muted">
                    {h.supporting.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label mb-1">{copy.investigation.evidenceAgainst}</p>
                  <ul className="list-disc pl-4 text-muted">
                    {h.counter.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                {h.challenge && (
                  <p className="sm:col-span-2">
                    <span className="font-semibold">{copy.investigation.challenge}:</span>{" "}
                    <span className="text-muted">{h.challenge}</span>
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

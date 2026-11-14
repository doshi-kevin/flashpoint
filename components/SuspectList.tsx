// Suspects, one card each: claim + status word, expandable evidence for/against and the Challenger's note.
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
    <ul className="space-y-2">
      {sorted.map((h) => (
        <li key={h.claim} className="rounded-lg border border-line bg-bg">
          <details>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3">
              <span className="font-medium">{h.claim}</span>
              <Badge tone={tone[h.status]}>{h.status}</Badge>
            </summary>
            <div className="space-y-2 border-t border-line p-3 text-sm">
              <div>
                <p className="font-semibold">{copy.findings.evidenceFor}</p>
                <ul className="list-disc pl-5 text-muted">
                  {h.supporting.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">{copy.findings.evidenceAgainst}</p>
                <ul className="list-disc pl-5 text-muted">
                  {h.counter.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              {h.challenge && (
                <p>
                  <span className="font-semibold">{copy.findings.challenge}:</span>{" "}
                  <span className="text-muted">{h.challenge}</span>
                </p>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

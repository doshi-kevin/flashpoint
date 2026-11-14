// Top suspects, one line each with a status word. Props: hypotheses (Hypothesis[]), max (default 3).
// Status is always shown as words, never by colour alone.
import Badge from "./Badge";
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

export default function SuspectList({ hypotheses, max = 3 }: { hypotheses: Hypothesis[]; max?: number }) {
  const top = [...hypotheses].sort((a, b) => rank[a.status] - rank[b.status]).slice(0, max);
  return (
    <ul className="divide-y divide-line">
      {top.map((h) => (
        <li key={h.claim} className="flex items-start justify-between gap-3 py-3">
          <span>{h.claim}</span>
          <Badge tone={tone[h.status]}>{h.status}</Badge>
        </li>
      ))}
    </ul>
  );
}

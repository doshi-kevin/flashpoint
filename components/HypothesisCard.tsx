// One hypothesis: claim, supporting + counter evidence, status label. Props: hypothesis (Hypothesis).
import Badge from "./Badge";
import { copy } from "@/content/copy";
import type { Hypothesis, HypothesisStatus } from "@/lib/types";

const tone: Record<HypothesisStatus, "good" | "warn" | "bad" | "neutral"> = {
  "Strongly supported": "good",
  Plausible: "warn",
  Weak: "neutral",
  Contradicted: "bad",
  "Insufficient info": "neutral",
};

export default function HypothesisCard({ hypothesis: h }: { hypothesis: Hypothesis }) {
  return (
    <div className="rounded border border-gray-200 p-3 text-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-medium">{h.claim}</p>
        <Badge tone={tone[h.status]}>{h.status}</Badge>
      </div>
      <p className="text-xs font-semibold text-gray-500">{copy.investigate.supporting}</p>
      <ul className="mb-2 list-disc pl-5">
        {h.supporting.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p className="text-xs font-semibold text-gray-500">{copy.investigate.counter}</p>
      <ul className="list-disc pl-5">
        {h.counter.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

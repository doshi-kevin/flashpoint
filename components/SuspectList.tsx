// Suspects as a table: hypothesis + status pill; click a row for evidence for/against and the Challenger's note.
// Props: hypotheses (Hypothesis[]). Status is always words plus an icon, never colour alone.
import Badge, { type BadgeTone } from "./Badge";
import AgentTag from "./AgentTag";
import { copy } from "@/content/copy";
import type { Hypothesis, HypothesisStatus } from "@/lib/types";

const rank: Record<HypothesisStatus, number> = {
  "Strongly supported": 0,
  Plausible: 1,
  "Insufficient info": 2,
  Weak: 3,
  Contradicted: 4,
};

const status: Record<HypothesisStatus, { tone: BadgeTone; icon: string }> = {
  "Strongly supported": { tone: "good", icon: "●" },
  Plausible: { tone: "warn", icon: "◐" },
  "Insufficient info": { tone: "neutral", icon: "?" },
  Weak: { tone: "neutral", icon: "○" },
  Contradicted: { tone: "bad", icon: "✕" },
};

export default function SuspectList({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const sorted = [...hypotheses].sort((a, b) => rank[a.status] - rank[b.status]);
  return (
    <div className="rounded-2xl border border-line/80 bg-card/85">
      <div className="label flex justify-between border-b border-line px-4 py-2.5">
        <span>{copy.investigation.cols.hypothesis}</span>
        <span>{copy.investigation.cols.status}</span>
      </div>
      <ul className="divide-y divide-line">
        {sorted.map((h) => {
          const s = status[h.status];
          return (
            <li key={h.claim}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 hover:bg-soft">
                  <span className={`font-semibold ${h.status === "Contradicted" ? "text-muted line-through" : ""}`}>
                    <span aria-hidden className="mr-2 inline-block font-mono text-xs text-muted transition-transform group-open:rotate-90">
                      ▸
                    </span>
                    {h.claim}
                  </span>
                  <Badge tone={s.tone}>
                    <span aria-hidden>{s.icon}</span> {h.status}
                  </Badge>
                </summary>
                <div className="grid gap-4 border-t border-line bg-paper px-4 py-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="label mb-1.5 !text-moss">{copy.investigation.evidenceFor}</p>
                    <ul className="space-y-1">
                      {h.supporting.map((x, i) => (
                        <li key={i} className="flex gap-2 text-ink-2">
                          <span aria-hidden className="text-moss">
                            ✓
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label mb-1.5 !text-crimson">{copy.investigation.evidenceAgainst}</p>
                    <ul className="space-y-1">
                      {h.counter.map((x, i) => (
                        <li key={i} className="flex gap-2 text-ink-2">
                          <span aria-hidden className="text-crimson">
                            ✕
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {h.challenge && (
                    <p className="flex flex-wrap items-baseline gap-2 sm:col-span-2">
                      <AgentTag agent="Challenger" />
                      <span className="font-semibold">{copy.investigation.challenge}:</span>
                      <span className="text-ink-2">{h.challenge}</span>
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

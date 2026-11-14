"use client";
// Shows the agents working. Steps arrive from the server as they finish; each is revealed with a short delay.
// Props: steps (TraceStep[], grows over time), done (stream finished), onFinished (called once when all shown).
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/copy";
import type { TraceStep } from "@/lib/types";

const STEP_MS = 450;

export default function AgentTrace({
  steps,
  done,
  onFinished,
}: {
  steps: TraceStep[];
  done: boolean;
  onFinished: () => void;
}) {
  const [shown, setShown] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (shown < steps.length) {
      const t = setTimeout(() => setShown((n) => n + 1), STEP_MS);
      return () => clearTimeout(t);
    }
    if (done && steps.length && !finished.current) {
      finished.current = true;
      onFinished();
    }
  }, [steps, shown, done, onFinished]);

  const allShown = shown >= steps.length;
  return (
    <div>
      <p className="eyebrow mb-3">{copy.agent.title}</p>
      <ul className="space-y-3 text-sm">
        {steps.slice(0, shown).map((s, i) => {
          const working = i === shown - 1 && allShown && !done;
          return (
            <li key={`${s.step}-${i}`} className="flex gap-3">
              {working ? (
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" aria-hidden />
              ) : (
                <span className="mt-0.5 shrink-0 text-good" aria-hidden>
                  ✓
                </span>
              )}
              <span>
                <span className="font-semibold">{s.step}</span>
                <span className="text-muted"> · {s.detail}</span>
                <span className="block text-xs text-muted/80">{s.source}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";
// Shows the agent working: steps appear one by one with a spinner, then a check.
// Props: steps (TraceStep[], empty while the API is still running), onFinished (called once all steps are shown).
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/copy";
import type { TraceStep } from "@/lib/types";

const STEP_MS = 550;

export default function AgentTrace({ steps, onFinished }: { steps: TraceStep[]; onFinished: () => void }) {
  const [shown, setShown] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (!steps.length) return;
    if (shown >= steps.length) {
      if (!finished.current) {
        finished.current = true;
        onFinished();
      }
      return;
    }
    const t = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [steps, shown, onFinished]);

  const waiting = !steps.length;
  const working = waiting || shown < steps.length;

  return (
    <div>
      <p className="eyebrow mb-3">{copy.agent.title}</p>
      <ul className="space-y-2 font-mono text-sm">
        {steps.slice(0, shown).map((s) => (
          <li key={s.step} className="flex gap-2">
            <span className="text-good" aria-hidden>
              ✓
            </span>
            <span>
              <span className="text-cream">{s.step}</span>
              <span className="text-muted"> — {s.detail}</span>
              <span className="block text-xs text-muted/70">{s.source}</span>
            </span>
          </li>
        ))}
        {working && (
          <li className="flex items-center gap-2 text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
            {copy.agent.thinking}
          </li>
        )}
      </ul>
    </div>
  );
}

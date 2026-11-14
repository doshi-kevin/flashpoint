"use client";
// Agent activity log. Steps arrive from the server as they finish; each is revealed with a short delay.
// Each step carries a tag naming who did it (Code, Detective, Challenger, Flashpoint).
// Props: steps (TraceStep[], grows over time), done (stream finished), onFinished (called once when all shown).
import { useEffect, useRef, useState } from "react";
import AgentTag, { agentFor } from "./AgentTag";
import { copy } from "@/content/copy";
import type { TraceStep } from "@/lib/types";

const STEP_MS = 350;

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
    <div className="rounded-2xl border border-line/80 bg-card/85">
      <p className="label border-b border-line px-4 py-2.5">{copy.investigation.log}</p>
      <ul className="divide-y divide-line text-sm">
        {steps.slice(0, shown).map((s, i) => {
          const working = i === shown - 1 && allShown && !done;
          return (
            <li key={`${s.step}-${i}`} className="grid grid-cols-[20px_1fr] gap-x-3 px-4 py-3 sm:grid-cols-[20px_104px_1fr]">
              {working ? (
                <span className="live-dot mt-1.5 h-2.5 w-2.5 rounded-full bg-ink" aria-hidden />
              ) : (
                <span className="mt-0.5 text-moss" aria-hidden>
                  ✓
                </span>
              )}
              <span className="col-start-2 mb-1 sm:col-start-auto sm:mb-0">
                <AgentTag agent={agentFor(s.step, s.source)} />
              </span>
              <span className="col-start-2 min-w-0 sm:col-start-auto">
                <span className="font-semibold">{s.step}</span>
                <span className="text-ink-2"> · {s.detail}</span>
                <span className="mt-0.5 block font-mono text-xs text-muted">{s.source}</span>
              </span>
            </li>
          );
        })}
        {steps.length === 0 && <li className="px-4 py-3 text-muted">Starting…</li>}
      </ul>
    </div>
  );
}

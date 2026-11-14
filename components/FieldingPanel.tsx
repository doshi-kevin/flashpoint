"use client";
// Flashpoint study progress: publish -> synthetic predicts -> real responses tick up.
// Props: sampleSize (final n), onFinished (called once). Replay of saved results; the lozenge says so.
import { useEffect, useRef, useState } from "react";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";

const TOTAL_MS = 4200;

export default function FieldingPanel({ sampleSize, onFinished }: { sampleSize: number; onFinished: () => void }) {
  const [t, setT] = useState(0); // 0..1
  const finished = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / TOTAL_MS);
      setT(p);
      if (p >= 1) {
        clearInterval(id);
        if (!finished.current) {
          finished.current = true;
          onFinished();
        }
      }
    }, 60);
    return () => clearInterval(id);
  }, [onFinished]);

  const phase = t < 0.2 ? 0 : t < 0.45 ? 1 : 2;
  const answering = Math.max(0, (t - 0.45) / 0.55);
  const count = Math.round(sampleSize * answering);

  return (
    <div className="rounded border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="label">{copy.fielding.title}</p>
        <SampleBadge kind="replay" />
      </div>
      <div className="p-4">
        <ul className="space-y-1.5 text-sm">
          {copy.fielding.phases.map((label, i) => (
            <li key={label} className={`flex items-center gap-2 ${i > phase ? "text-muted/60" : ""}`}>
              {i < phase ? (
                <span className="text-good" aria-hidden>
                  ✓
                </span>
              ) : i === phase ? (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-info" aria-hidden />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-line" aria-hidden />
              )}
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{count}</span>
          <span className="text-muted">
            / {sampleSize} {copy.fielding.responses}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded bg-soft">
          <div className="h-1.5 rounded bg-info" style={{ width: `${answering * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

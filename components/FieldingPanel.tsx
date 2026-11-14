"use client";
// Shows Flashpoint fielding the study: publish -> synthetic predicts -> real responses tick up.
// Props: sampleSize (final n), onFinished (called once). Replay of saved results; the badge says so.
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">{copy.fielding.title}</p>
        <SampleBadge kind="replay" />
      </div>
      <ul className="space-y-2 text-sm">
        {copy.fielding.phases.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${i > phase ? "text-muted/60" : ""}`}>
            {i < phase ? (
              <span className="text-good" aria-hidden>
                ✓
              </span>
            ) : i === phase ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
            ) : (
              <span className="h-2 w-2 rounded-full bg-line" aria-hidden />
            )}
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-end gap-3">
        <span className="font-serif text-5xl font-semibold tabular-nums">{count}</span>
        <span className="pb-1 text-muted">
          / {sampleSize} {copy.fielding.responses}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded bg-line">
        <div className="h-1.5 rounded bg-accent" style={{ width: `${answering * 100}%` }} />
      </div>
    </div>
  );
}

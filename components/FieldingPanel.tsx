"use client";
// Flashpoint study progress: publish -> synthetic predicts -> real responses tick up.
// Props: sampleSize (final n), onFinished (called once). Replay of saved results; the label says so.
import { useEffect, useRef, useState } from "react";
import SampleBadge from "./SampleBadge";
import FlashpointMark from "./FlashpointMark";
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
    <div className="rounded-2xl border border-line/80 bg-card/85">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          <p className="label">{copy.fielding.title}</p>
          <FlashpointMark />
        </div>
        <SampleBadge kind="replay" />
      </div>
      <div className="p-4">
        <ul className="space-y-2 text-sm">
          {copy.fielding.phases.map((label, i) => (
            <li key={label} className={`flex items-center gap-2.5 ${i > phase ? "text-muted/70" : ""}`}>
              {i < phase ? (
                <span className="w-3 text-moss" aria-hidden>
                  ✓
                </span>
              ) : i === phase ? (
                <span className="live-dot ml-0.5 h-2.5 w-2.5 rounded-full bg-ink" aria-hidden />
              ) : (
                <span className="ml-0.5 h-2.5 w-2.5 rounded-full border border-line-strong" aria-hidden />
              )}
              <span className={i === phase ? "font-semibold" : ""}>{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="tabular font-mono text-5xl font-medium">{count}</span>
          <span className="font-mono text-sm text-muted">
            / {sampleSize} {copy.fielding.responses}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-sm bg-line" role="progressbar" aria-valuenow={Math.round(answering * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-2 rounded-sm bg-lime ring-1 ring-ink/30" style={{ width: `${answering * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

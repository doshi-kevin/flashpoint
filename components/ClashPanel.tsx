"use client";
// Analytical clash: the AI desk prior (synthetic customers, grey hatched) against the ground truth
// (real people via Flashpoint, lime), separated by a floating VS node. Props: results (StudyResults).
// All percentages and gaps come from the study and lib/metrics.
import { useEffect, useState } from "react";
import Badge from "./Badge";
import FlashpointMark from "./FlashpointMark";
import SampleBadge from "./SampleBadge";
import { computeGaps, topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";
import type { StudyResults } from "@/lib/types";

export default function ClashPanel({ results }: { results: StudyResults }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = computeGaps(results);
  const synTop = topOption(results, "synthetic");
  const realTop = topOption(results, "real");
  const pct = (key: "synthetic" | "real", o: string) => results[key][results.options.indexOf(o)];
  const miss = rows.find((r) => r.biggest);
  const flipped = synTop !== realTop;

  return (
    <div className="sculpt relative p-5 sm:p-8">
      <p className="mb-6 text-xl font-extrabold leading-snug sm:text-2xl">{copy.study.headline(synTop, realTop)}</p>
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* AI desk prior */}
        <section className="prior-card space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-muted" aria-hidden />
              <span className="label">{copy.canvas.prior}</span>
            </div>
            {flipped ? (
              <Badge tone="bad">
                <span aria-hidden>✕</span> {copy.canvas.notSupported}
              </Badge>
            ) : (
              <SampleBadge kind="synthetic" />
            )}
          </div>
          <div>
            <p className={`text-2xl font-extrabold tracking-tight text-ink-2 ${flipped ? "line-through decoration-crimson/60" : ""}`}>
              “{synTop}”
            </p>
            <p className="mt-1 text-sm text-muted">
              {copy.canvas.priorSub} · top answer {pct("synthetic", synTop)}%
            </p>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.option}>
                <div className="flex justify-between font-mono text-xs text-muted">
                  <span>{r.option}</span>
                  <span>{r.synthetic}%</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-line/80 p-0.5" role="img" aria-label={`${r.option}: ${r.synthetic}% predicted`}>
                  <div className="hatch h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: on ? `${r.synthetic}%` : "0%" }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Synthetic personas are a contrast, never evidence.</p>
        </section>

        {/* VS node */}
        <div className="flex justify-center" aria-hidden>
          <div className="float-slow rounded-full bg-gradient-to-tr from-lime via-amber to-crimson p-1 shadow-[0_12px_28px_rgba(169,116,26,0.25)]">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-card shadow-inner">
              <span className="text-2xl font-black italic">VS</span>
            </div>
          </div>
        </div>

        {/* Ground truth */}
        <section className="truth-card space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="live-dot h-3 w-3 rounded-full bg-lime shadow-[0_0_8px_rgba(217,240,107,0.9)]" aria-hidden />
              <span className="label !text-ink">{copy.canvas.truth}</span>
            </div>
            <Badge tone="real">
              <span aria-hidden>✓</span> {copy.canvas.validated}
            </Badge>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">“{realTop}”</p>
            <p className="mt-1 text-sm text-ink-2">
              {copy.canvas.truthSub} · {pct("real", realTop)}% chose it · n = {results.sampleSize}
            </p>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.option}>
                <div className="flex justify-between font-mono text-xs">
                  <span className={r.option === realTop ? "font-medium text-ink" : "text-ink-2"}>{r.option}</span>
                  <span className={r.option === realTop ? "font-medium" : ""}>{r.real}%</span>
                </div>
                <div className="mt-1 h-3.5 overflow-hidden rounded-full bg-soft p-0.5 shadow-inner" role="img" aria-label={`${r.option}: ${r.real}% of real people`}>
                  <div className="lime-bar h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: on ? `${r.real}%` : "0%" }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FlashpointMark detail={`n = ${results.sampleSize}`} />
            <SampleBadge kind="replay" />
          </div>
        </section>
      </div>

      {miss && (
        <p className="mt-6 flex flex-wrap items-center gap-2 border-t border-line/70 pt-4 text-sm">
          <Badge tone="bad">
            <span aria-hidden>✕</span> {copy.study.miss}
          </Badge>
          <span className="font-semibold">“{miss.option}”</span>
          <span className="font-mono text-crimson">
            {miss.gap > 0 ? "+" : ""}
            {miss.gap} pts
          </span>
          <span className="text-muted">between what the AI predicted and what real people said.</span>
        </p>
      )}
    </div>
  );
}

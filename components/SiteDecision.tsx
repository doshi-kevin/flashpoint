"use client";
// Store 51 site decision (fed by GET /api/market-entry). Shows, in the executive-canvas style:
//   03 Where to open: each area on paper (desk, hatched) vs with Flashpoint research (lime / crimson)
//   04 What to sell: what people SAID (survey) vs what they DID (Market Experiment Pull)
//   05 Is the research worth it: value of each Flashpoint rung vs its cost
//   06 How sure: sensitivity of the pick, plus the Flashpoint study specs ready to field
// Lime = real people / Flashpoint evidence. Hatched grey = desk-only estimate. Crimson = money lost.
import { useEffect, useState } from "react";
import FlashpointMark from "./FlashpointMark";
import type { MarketEntryReport } from "@/lib/market-entry-data";

const money = (x: number) => `${x < 0 ? "−" : "+"}$${(Math.abs(x) / 1e6).toFixed(2)}M`;
const dollars = (x: number) => `$${Math.round(x).toLocaleString("en-US")}`;

export default function SiteDecision() {
  const [r, setR] = useState<MarketEntryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/market-entry")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setR)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <p className="chip-alert p-4 text-sm font-medium">Site decision unavailable: {error}</p>;
  if (!r) return <p className="text-ink-2">Loading the site decision…</p>;

  const desk = r.levels.find((l) => l.rung === "desk")!;
  const full = r.levels.find((l) => l.rung === "survey_experiment")!;
  const rec = r.recommendation;
  const scale = Math.max(...[...desk.areas, ...full.areas].map((a) => Math.abs(a.npv)), 1);
  const pickConcepts = rec ? r.concepts.find((c) => c.area === rec.area) : null;
  const flips = r.sensitivity.rows.filter((x) => x.flips).length;

  return (
    <div className="space-y-10">
      {/* 03 Where to open */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label">Section 03 // Where to open</span>
          <FlashpointMark detail="ZIP survey + Market Experiment" />
          <span className="chip-alert px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider">Simulated until fielded</span>
        </div>
        <p className="max-w-3xl text-ink-2">{r.decision} Ten-year value of each site, first on paper, then with what real people in each ZIP told Flashpoint and did in market.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {r.candidates.map((c) => {
            const d = desk.areas.find((a) => a.id === c.id)!;
            const f = full.areas.find((a) => a.id === c.id)!;
            const picked = rec?.area === c.id;
            return (
              <article key={c.id} className={`${picked ? "truth-card" : "sculpt"} space-y-4 p-6`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted">Area {c.id} · {c.zips.join(", ")}</p>
                    <h3 className="text-2xl font-black tracking-tight">{c.name}</h3>
                  </div>
                  {picked && <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] font-bold uppercase text-paper">Open here</span>}
                </div>
                <p className="text-sm text-ink-2">{c.story}</p>
                <Bar label="On paper" value={d.npv} scale={scale} kind="desk" />
                <Bar label="With Flashpoint" value={f.npv} scale={scale} kind={f.npv >= 0 ? "real" : "loss"} />
                <p className="font-mono text-xs text-ink-2">
                  {dollars(f.annualSales)} a year · {Math.round(f.weeklyVisits).toLocaleString("en-US")} visits a week
                </p>
                <blockquote className="border-l-2 border-lime-deep pl-3 font-serif text-[15px] italic leading-snug">“{c.verbatims[0]}”</blockquote>
              </article>
            );
          })}
        </div>
      </section>

      {/* 04 What to sell */}
      {rec && pickConcepts && (
        <section className="amber-card relative overflow-hidden p-6 sm:p-10">
          <div className="relative space-y-6">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-widest">
              <span className="h-2.5 w-2.5 rounded-full bg-ochre" aria-hidden /> Section 04 // Say vs do in {rec.name}
            </span>
            <h2 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              They said “{pickConcepts.saidTop}”. They clicked “{pickConcepts.didTop}”.
            </h2>
            <div className="glass sculpt-alt grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_1.2fr]">
              <div className="space-y-2">
                <p className="label !text-ink-2">Recommendation</p>
                <p className="text-2xl font-black leading-tight">
                  Open in {rec.name} with the {rec.concept}
                  {rec.newProduct ? ": a new product for the chain" : ""}.
                </p>
                <p className="text-sm font-semibold">
                  {money(rec.npv)} over 10 years · {dollars(rec.projectedAnnualSales ?? 0)} a year. The research also avoided a {money(rec.avoidedLoss)} site.
                </p>
              </div>
              <div className="space-y-2">
                <p className="label !text-ink-2">Flashpoint Market Experiment · Pull (100 = average), 95% interval</p>
                {Object.entries(pickConcepts.pull).map(([concept, p]) => (
                  <PullRow key={concept} concept={concept} p={p} top={concept === pickConcepts.didTop} said={concept === pickConcepts.saidTop} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 05 Research value */}
      <section className="space-y-3">
        <span className="label">Section 05 // Was the research worth it?</span>
        <div className="sculpt grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          {r.research.map((x) => (
            <div key={x.id} className="space-y-1">
              <p className="text-sm font-bold">{x.label}</p>
              <p className="font-mono text-xs text-muted">Costs {dollars(x.cost)} · {x.days} day{x.days === 1 ? "" : "s"}</p>
              <p className="text-3xl font-black tracking-tight">{x.id === "desk" ? "—" : dollars(x.value)}</p>
              <p className="text-xs text-ink-2">{x.id === "desk" ? "Baseline: what you know without asking anyone." : `expected value of better decisions · ${x.roi}× its cost`}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 06 Sensitivity + study specs */}
      <section className="space-y-3">
        <span className="label">Section 06 // How sure are we?</span>
        <div className="sculpt grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-3 font-bold">
              {flips === 0
                ? `${rec?.name ?? "The pick"} stays the best site under every assumption range tested.`
                : `${flips} assumption${flips === 1 ? "" : "s"} could change the pick. Ask Flashpoint about ${flips === 1 ? "it" : "them"} first.`}
            </p>
            <ul className="space-y-2">
              {r.sensitivity.rows.slice(0, 5).map((x) => (
                <li key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                  <span>{x.label}</span>
                  <span className={`font-mono text-xs ${x.flips ? "text-crimson" : "text-ink-2"}`}>
                    {money(x.basePickNpvAtLow)} to {money(x.basePickNpvAtHigh)}
                    {x.flips ? " · flips" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <details className="glass rounded-2xl p-4">
            <summary className="cursor-pointer font-bold">Ready to field on Flashpoint</summary>
            <StudySpecs specs={r.studySpecs} />
          </details>
        </div>
      </section>
    </div>
  );
}

function Bar({ label, value, scale, kind }: { label: string; value: number; scale: number; kind: "desk" | "real" | "loss" }) {
  const w = `${Math.max(3, (Math.abs(value) / scale) * 100)}%`;
  const fill = kind === "desk" ? "hatch" : kind === "real" ? "bg-lime-deep" : "bg-crimson";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className={`font-mono ${value < 0 ? "text-crimson" : ""}`}>{money(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-soft">
        <div className={`h-3 rounded-full ${fill}`} style={{ width: w }} />
      </div>
    </div>
  );
}

function PullRow({ concept, p, top, said }: { concept: string; p: { pull: number; low: number; high: number }; top: boolean; said: boolean }) {
  const max = 220;
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span className={top ? "font-black" : "font-medium"}>
          {concept}
          {said ? " · what they said" : ""}
        </span>
        <span className="font-mono">
          {p.pull} ({p.low}–{p.high})
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-white/60">
        <div className={`absolute h-3 rounded-full ${top ? "bg-lime-deep" : "bg-ink/25"}`} style={{ width: `${(p.pull / max) * 100}%` }} />
        <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink" style={{ left: `${(p.low / max) * 100}%`, width: `${((p.high - p.low) / max) * 100}%` }} />
        <div className="absolute top-0 h-3 w-px bg-ink/40" style={{ left: `${(100 / max) * 100}%` }} title="100 = average" />
      </div>
    </div>
  );
}

type Specs = {
  survey?: { audience?: string; completesPerArea?: number; questions?: { id: string; type: string; text: string }[] };
  experiment?: { platform?: string; cells?: string[]; design?: string; metric?: string };
  _note?: string;
};

function StudySpecs({ specs }: { specs: unknown }) {
  const s = specs as Specs;
  return (
    <div className="mt-3 space-y-3 text-sm">
      {s.survey && (
        <div>
          <p className="font-semibold">ZIP survey · {s.survey.completesPerArea} completes per area</p>
          <p className="text-xs text-ink-2">{s.survey.audience}</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs">
            {s.survey.questions?.map((q) => (
              <li key={q.id}>
                {q.text} <span className="font-mono text-muted">({q.type})</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {s.experiment && (
        <div>
          <p className="font-semibold">Market Experiment · {s.experiment.platform}</p>
          <p className="text-xs text-ink-2">{s.experiment.design}</p>
          <p className="text-xs">Cells: {s.experiment.cells?.join(" · ")}</p>
        </div>
      )}
      {s._note && <p className="text-xs text-muted">{s._note}</p>}
    </div>
  );
}

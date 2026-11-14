"use client";
// The whole demo on one page. Props: storeId, storeName, area, changePct (computed in code), sales, events.
// Flow (one click each): 1 Drop -> 2 Why (/api/investigate) -> 3 Ask (/api/study) -> 4 Decide (/api/decision).
// Janvi: restyle the JSX freely; keep the fetch calls and the `step` state as they are.
import { useEffect, useRef, useState } from "react";
import SalesChart from "./SalesChart";
import SuspectList from "./SuspectList";
import UnknownCallout from "./UnknownCallout";
import StudyCompare from "./StudyCompare";
import DecisionBanner from "./DecisionBanner";
import Stepper from "./Stepper";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { Decision, Investigation, SalesPoint, StoreEvent, StudyResults } from "@/lib/types";

type Props = {
  storeId: string;
  storeName: string;
  area: string;
  changePct: number;
  sales: SalesPoint[];
  events: StoreEvent[];
};

const btn = "rounded bg-black px-5 py-3 text-base font-semibold text-white disabled:opacity-50";

export default function Dashboard({ storeId, storeName, area, changePct, sales, events }: Props) {
  const [step, setStep] = useState(1);
  const [live, setLive] = useState(false); // off = instant replay (default for the demo)
  const [loading, setLoading] = useState(false);
  const [inv, setInv] = useState<{ result: Investigation; source: "claude" | "fallback" } | null>(null);
  const [study, setStudy] = useState<StudyResults | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step > 1) bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, inv, study]);

  async function investigate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, live }),
      });
      setInv(await res.json());
      setStep(2);
    } catch {
      setError("Could not run the investigation.");
    } finally {
      setLoading(false);
    }
  }

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const [s, d] = await Promise.all([
        fetch(`/api/study/${storeId}`).then((r) => r.json()),
        fetch(`/api/decision/${storeId}`).then((r) => r.json()),
      ]);
      if (!s.results || !d.decision) throw new Error("missing");
      setStudy(s.results);
      setDecision(d.decision);
      setStep(3);
    } catch {
      setError("Could not load the study.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep(1);
    setInv(null);
    setStudy(null);
    setDecision(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const card = "rounded-lg border border-gray-200 p-5";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper step={step} />
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} disabled={step > 1} />
          {copy.liveToggle}
        </label>
      </div>

      {/* 1. Drop */}
      <section className={card}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">
              {storeName} · {area}
            </p>
            <p className="text-5xl font-extrabold text-red-600">{changePct.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">{copy.drop.label}</p>
          </div>
          <SampleBadge />
        </div>
        <div className="mt-3">
          <SalesChart data={sales} events={events} />
        </div>
        {step === 1 && (
          <button onClick={investigate} disabled={loading} className={`${btn} mt-4`}>
            {loading ? copy.why.running : copy.drop.button}
          </button>
        )}
      </section>

      {/* 2. Why */}
      {step >= 2 && inv && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{copy.why.title}</h2>
            {inv.source === "fallback" && <SampleBadge kind="replay" />}
          </div>
          <SuspectList hypotheses={inv.result.hypotheses} />
          <UnknownCallout text={inv.result.unknown} />
          <div>
            <p className="text-sm text-gray-500">{copy.why.questionTitle}</p>
            <p className="text-lg font-semibold">{inv.result.question.text}</p>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {inv.result.question.options.map((o) => (
                <li key={o} className="rounded-full border border-gray-300 px-3 py-1">
                  {o}
                </li>
              ))}
            </ul>
          </div>
          {step === 2 && (
            <button onClick={ask} disabled={loading} className={btn}>
              {copy.why.button}
            </button>
          )}
        </section>
      )}

      {/* 3. Ask */}
      {step >= 3 && study && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{study.question}</h2>
            <SampleBadge kind="replay" />
          </div>
          <StudyCompare results={study} />
          {step === 3 && (
            <button onClick={() => setStep(4)} className={btn}>
              {copy.ask.button}
            </button>
          )}
        </section>
      )}

      {/* 4. Decide */}
      {step >= 4 && decision && (
        <section className={`${card} space-y-4`}>
          <h2 className="text-lg font-bold">{copy.decide.title}</h2>
          <DecisionBanner decision={decision} />
          <button onClick={restart} className="text-sm underline">
            {copy.decide.restart}
          </button>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div ref={bottom} />
    </div>
  );
}

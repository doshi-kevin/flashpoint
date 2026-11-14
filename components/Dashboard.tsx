"use client";
// The whole demo on one page. Props: storeId, storeName, area, changePct (computed in code), sales, events.
// Flow, one click each:
//   1 Drop -> 2 Why (agent works, /api/investigate) -> 3 Ask (Flashpoint fields the study, /api/study) -> 4 Decide (/api/decision)
// Janvi: restyle the JSX freely; keep the fetch calls and the step/stage state as they are.
import { useCallback, useEffect, useRef, useState } from "react";
import SalesChart from "./SalesChart";
import AgentTrace from "./AgentTrace";
import SuspectList from "./SuspectList";
import UnknownCallout from "./UnknownCallout";
import FieldingPanel from "./FieldingPanel";
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

const btn =
  "rounded-full bg-accent px-6 py-3 text-base font-semibold text-ink transition hover:brightness-110 disabled:opacity-50";
const card = "rounded-xl border border-line bg-panel p-5 sm:p-6";

export default function Dashboard({ storeId, storeName, area, changePct, sales, events }: Props) {
  const [step, setStep] = useState(1);
  const [live, setLive] = useState(false); // off = instant replay (default for the demo)
  const [loading, setLoading] = useState(false);
  const [inv, setInv] = useState<{ result: Investigation; source: "claude" | "fallback" } | null>(null);
  const [traceDone, setTraceDone] = useState(false);
  const [study, setStudy] = useState<StudyResults | null>(null);
  const [fieldDone, setFieldDone] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const onTraceDone = useCallback(() => setTraceDone(true), []);
  const onFieldDone = useCallback(() => setFieldDone(true), []);

  useEffect(() => {
    if (step > 1) bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, traceDone, fieldDone]);

  async function investigate() {
    setLoading(true);
    setError(null);
    setStep(2); // show the agent working right away
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, live }),
      });
      setInv(await res.json());
    } catch {
      setError("Could not run the investigation.");
      setStep(1);
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
    setTraceDone(false);
    setFieldDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper step={step} />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            disabled={step > 1}
            className="accent-[#f4501e]"
          />
          {copy.liveToggle}
        </label>
      </div>

      {/* 1. Drop */}
      <section className={card}>
        <div className="flex items-start justify-between gap-2">
          <p className="eyebrow">{copy.eyebrows[0]}</p>
          <SampleBadge />
        </div>
        <p className="mt-3 text-sm text-muted">
          {storeName} · {area}
        </p>
        <p className="font-serif text-7xl font-semibold leading-none text-accent">{changePct.toFixed(1)}%</p>
        <p className="mt-1 text-sm text-muted">{copy.drop.label}</p>
        <div className="mt-4">
          <SalesChart data={sales} events={events} />
        </div>
        {step === 1 && (
          <button onClick={investigate} disabled={loading} className={`${btn} mt-5`}>
            {copy.drop.button}
          </button>
        )}
      </section>

      {/* 2. Why: the agent works, then shows its findings */}
      {step >= 2 && (
        <section className={`${card} space-y-5`}>
          <div className="flex items-start justify-between gap-2">
            <p className="eyebrow">{copy.eyebrows[1]}</p>
            {inv?.source === "fallback" && <SampleBadge kind="replay" />}
          </div>
          <AgentTrace steps={inv?.result.trace ?? []} onFinished={onTraceDone} />
          {traceDone && inv && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl">{copy.why.title}</h2>
              <SuspectList hypotheses={inv.result.hypotheses} />
              <UnknownCallout text={inv.result.unknown} />
              <div>
                <p className="text-sm text-muted">{copy.why.questionTitle}</p>
                <p className="font-serif text-2xl">{inv.result.question.text}</p>
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  {inv.result.question.options.map((o) => (
                    <li key={o} className="rounded-full border border-line px-3 py-1">
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
            </div>
          )}
        </section>
      )}

      {/* 3. Ask: Flashpoint fields the study, then results */}
      {step >= 3 && study && (
        <section className={`${card} space-y-5`}>
          <p className="eyebrow">{copy.eyebrows[2]}</p>
          <FieldingPanel sampleSize={study.sampleSize} onFinished={onFieldDone} />
          {fieldDone && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl">{study.question}</h2>
              <StudyCompare results={study} />
              {step === 3 && (
                <button onClick={() => setStep(4)} className={btn}>
                  {copy.ask.button}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 4. Decide */}
      {step >= 4 && decision && (
        <section className={`${card} space-y-5`}>
          <p className="eyebrow">{copy.eyebrows[3]}</p>
          <h2 className="font-serif text-3xl">{copy.decide.title}</h2>
          <DecisionBanner decision={decision} />
          <button onClick={restart} className="text-sm text-muted underline hover:text-cream">
            {copy.decide.restart}
          </button>
        </section>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}
      <div ref={bottom} />
    </div>
  );
}

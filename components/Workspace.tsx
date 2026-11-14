"use client";
// The interactive part of the page. Flow:
//   type a problem -> /api/agent streams the agents' steps -> findings (suspects, the gap, the one question)
//   -> "Send to real people" -> Flashpoint study (/api/study, /api/decision) -> decision.
// Janvi: restyle JSX/classes freely; keep the fetch/stream code and state as it is.
import { useCallback, useEffect, useRef, useState } from "react";
import ProblemForm from "./ProblemForm";
import CaseFacts, { type Facts } from "./CaseFacts";
import AgentTrace from "./AgentTrace";
import SuspectList from "./SuspectList";
import UnknownCallout from "./UnknownCallout";
import QuestionCard from "./QuestionCard";
import FieldingPanel from "./FieldingPanel";
import StudyCompare from "./StudyCompare";
import DecisionBanner from "./DecisionBanner";
import QrBlock from "./QrBlock";
import SampleBadge from "./SampleBadge";
import Badge from "./Badge";
import { copy } from "@/content/copy";
import type { Decision, Investigation, SalesPoint, StoreEvent, StudyResults, TraceStep } from "@/lib/types";

type CaseData = { store: { name: string }; facts: Facts; sales: SalesPoint[]; events: StoreEvent[] };

const card = "rounded-xl border border-line bg-panel p-5 sm:p-6";
const btn =
  "rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:brightness-95 disabled:opacity-50";
const surveyUrl = process.env.NEXT_PUBLIC_JUDGE_SURVEY_URL || "https://example.com/judge-survey";

export default function Workspace() {
  const [problem, setProblem] = useState(copy.form.examples[0].text);
  const [live, setLive] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [inv, setInv] = useState<{ result: Investigation; source: "claude" | "fallback"; storeId: string | null } | null>(null);
  const [traceDone, setTraceDone] = useState(false);
  const [study, setStudy] = useState<StudyResults | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [asked, setAsked] = useState(false);
  const [fieldDone, setFieldDone] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const onTraceDone = useCallback(() => setTraceDone(true), []);
  const onFieldDone = useCallback(() => setFieldDone(true), []);

  useEffect(() => {
    if (running || traceDone || asked || fieldDone || showDecision)
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length, traceDone, asked, fieldDone, showDecision, running]);

  function reset() {
    setDone(false);
    setSteps([]);
    setCaseData(null);
    setInv(null);
    setTraceDone(false);
    setStudy(null);
    setDecision(null);
    setAsked(false);
    setFieldDone(false);
    setShowDecision(false);
    setError(null);
  }

  async function run() {
    reset();
    setRunning(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, live }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "case") setCaseData(ev);
          else if (ev.type === "step") setSteps((s) => [...s, { step: ev.step, detail: ev.detail, source: ev.source }]);
          else if (ev.type === "result") setInv({ result: ev.result, source: ev.source, storeId: ev.storeId });
          else if (ev.type === "error") throw new Error(ev.message);
        }
      }
      setDone(true);
    } catch (e) {
      setError(`The investigation failed: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  async function ask() {
    setAsked(true);
    const id = inv?.storeId;
    if (!id) return; // no matching store: nothing saved to replay, show the live QR instead
    try {
      const [s, d] = await Promise.all([
        fetch(`/api/study/${id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/decision/${id}`).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (s?.results && d?.decision) {
        setStudy(s.results);
        setDecision(d.decision);
      }
    } catch {
      /* falls through to the live QR */
    }
  }

  function startOver() {
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const r = inv?.result;

  return (
    <div className="mt-10 space-y-5">
      <ProblemForm value={problem} onChange={setProblem} live={live} onLiveChange={setLive} running={running} onRun={run} />

      {caseData && <CaseFacts storeName={caseData.store.name} facts={caseData.facts} sales={caseData.sales} events={caseData.events} />}

      {(steps.length > 0 || running) && (
        <section className={card}>
          <div className="mb-3 flex justify-end">{inv?.source === "fallback" && <SampleBadge kind="replay" />}</div>
          <AgentTrace steps={steps} done={done} onFinished={onTraceDone} />
        </section>
      )}

      {traceDone && r && (
        <section className={`${card} space-y-6`}>
          <h2 className="font-serif text-3xl">{copy.findings.title}</h2>
          {r.verdict && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="eyebrow">{copy.findings.verdictTitle}</span>
              <Badge tone="neutral">{copy.findings.verdict[r.verdict.label]}</Badge>
              <span className="text-muted">{r.verdict.reason}</span>
            </p>
          )}
          <div>
            <p className="eyebrow mb-2">{copy.findings.suspects}</p>
            <SuspectList hypotheses={r.hypotheses} />
          </div>
          <UnknownCallout text={r.unknown} />
          <div className="space-y-3">
            <p className="font-semibold">{copy.findings.questionTitle}</p>
            <QuestionCard text={r.question.text} options={r.question.options} />
            <p className="max-w-xl text-sm text-muted">{r.rationale}</p>
          </div>
          {!asked && (
            <button onClick={ask} className={btn}>
              {copy.findings.send}
            </button>
          )}
        </section>
      )}

      {asked && study && (
        <section className={`${card} space-y-6`}>
          <FieldingPanel sampleSize={study.sampleSize} onFinished={onFieldDone} />
          {fieldDone && (
            <div className="space-y-5">
              <h2 className="font-serif text-2xl">{study.question}</h2>
              <StudyCompare results={study} />
              {!showDecision && (
                <button onClick={() => setShowDecision(true)} className={btn}>
                  {copy.ask.button}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {asked && !study && (
        <section className={`${card} flex flex-col items-center gap-3 text-center`}>
          <p className="max-w-md text-muted">{copy.ask.noStudy}</p>
          <QrBlock url={surveyUrl} size={200} />
        </section>
      )}

      {showDecision && decision && (
        <section className={`${card} space-y-5`}>
          <h2 className="font-serif text-3xl">{copy.decide.title}</h2>
          <DecisionBanner decision={decision} />
          <button onClick={startOver} className="text-sm text-muted underline hover:text-fg">
            {copy.decide.restart}
          </button>
        </section>
      )}

      {error && <p className="rounded-lg border border-accent bg-accent/10 p-3 text-sm text-accent-ink">{error}</p>}
      <div ref={bottom} />
    </div>
  );
}

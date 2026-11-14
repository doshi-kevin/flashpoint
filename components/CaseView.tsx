"use client";
// A single case, laid out like a work-tracking issue: header with workflow status + one primary action,
// tabs (Overview / Investigation / Flashpoint study / Decision) and a Details panel on the right.
// Props: caseKey, title, initialStoreId, initialCase, problem, autoRun, initialLive.
// Janvi: restyle JSX/classes freely; keep the stream/fetch code and state as it is (Aditya wires the live integration).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CaseFacts, { sign, type Facts } from "./CaseFacts";
import AgentTrace from "./AgentTrace";
import SuspectList from "./SuspectList";
import UnknownCallout from "./UnknownCallout";
import QuestionCard from "./QuestionCard";
import FieldingPanel from "./FieldingPanel";
import StudyCompare from "./StudyCompare";
import PrecedentsPanel from "./PrecedentsPanel";
import AdCard from "./AdCard";
import DecisionBanner from "./DecisionBanner";
import QrBlock from "./QrBlock";
import Badge from "./Badge";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { Decision, Investigation, SalesPoint, StoreEvent, StudyResults, TraceStep } from "@/lib/types";

export type CaseData = { store: { id: string; name: string; area: string }; facts: Facts; sales: SalesPoint[]; events: StoreEvent[] };
type Tab = "overview" | "investigation" | "study" | "decision";
type Inv = { result: Investigation; source: "claude" | "fallback"; storeId: string | null };

type Props = {
  caseKey: string;
  title: string;
  problem: string;
  initialStoreId: string | null;
  initialCase: CaseData | null;
  autoRun?: boolean;
  initialLive?: boolean;
};

const surveyUrl = process.env.NEXT_PUBLIC_JUDGE_SURVEY_URL || "https://example.com/judge-survey";
const stageTone = ["neutral", "info", "info", "info", "info", "warn", "good"] as const;
const primary = "rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50";

const time = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function CaseView({ caseKey, title, problem, initialStoreId, initialCase, autoRun, initialLive = true }: Props) {
  // stage: 0 open, 1 investigating, 2 investigated, 3 in field, 4 study complete, 5 decision ready, 6 approved
  const [stage, setStage] = useState(0);
  const [tab, setTab] = useState<Tab>("overview");
  const [live, setLive] = useState(initialLive);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [done, setDone] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(initialCase);
  const [inv, setInv] = useState<Inv | null>(null);
  const [traceDone, setTraceDone] = useState(false);
  const [study, setStudy] = useState<StudyResults | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [noStudy, setNoStudy] = useState(false);
  const [fieldDone, setFieldDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<{ at: string; text: string }[]>([{ at: time(), text: `Case ${caseKey} created` }]);
  const started = useRef(false);

  const log = (text: string) => setActivity((a) => [{ at: time(), text }, ...a]);
  const onTraceDone = useCallback(() => setTraceDone(true), []);
  const onFieldDone = useCallback(() => setFieldDone(true), []);

  // When the agent log has finished playing, move to "Investigated".
  useEffect(() => {
    if (traceDone && inv && stage === 1) {
      setStage(2);
      setActivity((a) => [{ at: time(), text: "Investigation complete: suspects ranked, open question and survey question drafted" }, ...a]);
    }
  }, [traceDone, inv, stage]);

  // When the study animation has finished, move to "Study complete".
  useEffect(() => {
    if (fieldDone && stage === 3) {
      setStage(4);
      setActivity((a) => [{ at: time(), text: "Flashpoint study complete" }, ...a]);
    }
  }, [fieldDone, stage]);

  async function run() {
    setStage(1);
    setTab("investigation");
    setSteps([]);
    setDone(false);
    setTraceDone(false);
    setInv(null);
    setError(null);
    log(`Investigation started (${live ? "live agents" : "replay"})`);
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
      setError(`Investigation failed: ${(e as Error).message}`);
      setStage(0);
    }
  }

  // Cases created from the dialog start investigating right away.
  useEffect(() => {
    if (autoRun && !started.current) {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function launch() {
    setStage(3);
    setTab("study");
    setFieldDone(false);
    log("Study launched on Flashpoint");
    const id = inv?.storeId ?? initialStoreId;
    try {
      const [s, d] = id
        ? await Promise.all([
            fetch(`/api/study/${id}`).then((r) => (r.ok ? r.json() : null)),
            fetch(`/api/decision/${id}`).then((r) => (r.ok ? r.json() : null)),
          ])
        : [null, null];
      if (s?.results && d?.decision) {
        setStudy(s.results);
        setDecision(d.decision);
      } else {
        setNoStudy(true);
        setStage(4);
      }
    } catch {
      setNoStudy(true);
      setStage(4);
    }
  }

  function viewDecision() {
    setStage(5);
    setTab("decision");
    log("Decision drafted from study results");
  }
  function approve() {
    setStage(6);
    log("Decision approved");
  }

  const r = inv?.result;
  const hasInv = stage >= 1;
  const store = caseData?.store;

  // The single primary action, like a workflow transition button.
  const action =
    stage === 0
      ? { label: copy.actions.run, onClick: run, disabled: false }
      : stage === 1
        ? { label: copy.actions.running, onClick: undefined, disabled: true }
        : stage === 2
          ? { label: copy.actions.launch, onClick: launch, disabled: false }
          : stage === 3
            ? { label: copy.actions.fielding, onClick: undefined, disabled: true }
            : stage === 4 && decision
              ? { label: copy.actions.viewDecision, onClick: viewDecision, disabled: false }
              : stage === 5
                ? { label: copy.actions.approve, onClick: approve, disabled: false }
                : stage === 6
                  ? { label: copy.actions.approved, onClick: undefined, disabled: true }
                  : null;

  const tabs: { id: Tab; label: string; enabled: boolean }[] = [
    { id: "overview", label: copy.tabs.overview, enabled: true },
    { id: "investigation", label: copy.tabs.investigation, enabled: stage >= 1 },
    { id: "study", label: copy.tabs.study, enabled: stage >= 3 },
    { id: "decision", label: copy.tabs.decision, enabled: stage >= 5 },
  ];

  const detail = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
      <dt className="label pt-0.5">{label}</dt>
      <dd className="text-right text-sm">{value}</dd>
    </div>
  );

  return (
    <div className="space-y-4">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          {copy.nav.cases}
        </Link>{" "}
        / <span className="text-fg">{caseKey}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={stageTone[stage]}>{copy.stages[stage]}</Badge>
            {inv?.source === "fallback" && <SampleBadge kind="replay" />}
          </div>
        </div>
        {action && (
          <button onClick={action.onClick} disabled={action.disabled} className={primary}>
            {action.label}
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <div className="flex gap-1 border-b border-line" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                disabled={!t.enabled}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  tab === t.id ? "border-info font-semibold text-info" : "border-transparent text-muted hover:text-fg"
                } disabled:opacity-40`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && <p className="rounded border border-[#f8a98f] bg-[#fff8f5] p-3 text-sm text-accent-ink">{error}</p>}

          {tab === "overview" && (
            <div className="space-y-4">
              <div className="rounded border border-line bg-panel p-4">
                <p className="label">Description</p>
                <p className="mt-1">{problem}</p>
              </div>
              {caseData && <CaseFacts facts={caseData.facts} sales={caseData.sales} events={caseData.events} />}
              <div className="rounded border border-line bg-panel">
                <p className="label border-b border-line px-4 py-2">{copy.overview.activity}</p>
                <ul className="divide-y divide-line text-sm">
                  {activity.map((a, i) => (
                    <li key={i} className="flex gap-3 px-4 py-2">
                      <span className="w-20 shrink-0 font-mono text-xs text-muted">{a.at}</span>
                      <span>{a.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "investigation" && (
            <div className="space-y-4">
              {hasInv && <AgentTrace steps={steps} done={done} onFinished={onTraceDone} />}
              {traceDone && r && (
                <>
                  <SuspectList hypotheses={r.hypotheses} />
                  <UnknownCallout text={r.unknown} />
                  <QuestionCard text={r.question.text} options={r.question.options} rationale={r.rationale} />
                  <PrecedentsPanel />
                </>
              )}
            </div>
          )}

          {tab === "study" && (
            <div className="space-y-4">
              {study && <FieldingPanel sampleSize={study.sampleSize} onFinished={onFieldDone} />}
              {study && fieldDone && <StudyCompare results={study} />}
              {study && fieldDone && <AdCard results={study} />}
              {noStudy && (
                <div className="flex flex-col items-center gap-3 rounded border border-line bg-panel p-6 text-center">
                  <p className="max-w-md text-muted">{copy.study.noStudy}</p>
                  <QrBlock url={surveyUrl} size={180} />
                </div>
              )}
            </div>
          )}

          {tab === "decision" && decision && <DecisionBanner decision={decision} />}
        </div>

        <aside className="h-fit rounded border border-line bg-panel p-4">
          <p className="label mb-1">{copy.details.title}</p>
          <dl>
            {detail(copy.details.status, <Badge tone={stageTone[stage]}>{copy.stages[stage]}</Badge>)}
            {detail(copy.details.store, store ? `${store.name} · ${store.area}` : "Not matched")}
            {caseData &&
              detail(
                copy.details.signal,
                <span className="font-semibold text-accent-ink">{sign(caseData.facts.weekdayLunchSalesChangePct)}</span>,
              )}
            {detail(copy.details.source, caseData?.facts.anomaly.flagged ? copy.cases.detectedBy : "Reported by a user")}
            {r?.verdict && detail(copy.details.verdict, copy.investigation.verdict[r.verdict.label])}
            {detail(copy.details.agents, "Detective + Challenger")}
            {detail(copy.details.data, <SampleBadge />)}
          </dl>
        </aside>
      </div>
    </div>
  );
}

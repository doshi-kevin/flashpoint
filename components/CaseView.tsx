"use client";
// A single case as an executive canvas: hero KPI, sales waveform, agents at work, the gap centerpiece,
// the analytical clash (AI prior vs real people) and the decision island. Sections appear as the workflow advances.
// Props: caseKey, title, initialStoreId, initialCase, problem, autoRun, initialLive.
// Janvi: restyle JSX/classes freely; keep the stream/fetch code and state as it is (Aditya wires the live integration).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sign, type Facts } from "./CaseFacts";
import AgentTrace from "./AgentTrace";
import SuspectList from "./SuspectList";
import FieldingPanel from "./FieldingPanel";
import PrecedentsPanel from "./PrecedentsPanel";
import AdCard from "./AdCard";
import WorkflowPath from "./WorkflowPath";
import Waveform from "./Waveform";
import GapCenterpiece from "./GapCenterpiece";
import ClashPanel from "./ClashPanel";
import ActionIsland from "./ActionIsland";
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

const time = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function SectionHead({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="label">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

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

  // Bring the newest section into view when the workflow moves on.
  const anchors = useRef<Record<Tab, HTMLElement | null>>({ overview: null, investigation: null, study: null, decision: null });
  useEffect(() => {
    if (tab !== "overview") anchors.current[tab]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tab]);

  const facts = caseData?.facts;
  const actionButton = action && (
    <button onClick={action.onClick} disabled={action.disabled} className="btn-lime flex items-center gap-2 px-6 py-3.5 text-base font-black tracking-tight">
      {action.disabled && stage !== 6 && <span className="live-dot h-2 w-2 rounded-full bg-ink" aria-hidden />}
      {action.label}
      {!action.disabled && <span aria-hidden>→</span>}
    </button>
  );

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-6">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="chip px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2 hover:text-ink">
            {copy.nav.cases}
          </Link>
          <span className="font-mono text-xs text-line-strong" aria-hidden>
            /
          </span>
          <span className="chip px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2">
            {copy.canvas.ribbon[0]} {caseKey}
          </span>
          {facts?.anomaly.flagged && (
            <>
              <span className="font-mono text-xs text-line-strong" aria-hidden>
                /
              </span>
              <span className="chip-alert flex items-center gap-2 px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-crimson">
                <span className="live-dot h-2 w-2 rounded-full bg-crimson" aria-hidden />
                {copy.canvas.ribbon[1]}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl space-y-3">
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">
              {store ? `${store.name} / ${store.area}` : title}
            </h1>
            {facts ? (
              <p className="text-lg leading-relaxed text-ink-2">
                {facts.visitsVsSpend
                  ? copy.canvas.visits(facts.visitsVsSpend.visitsPct, facts.visitsVsSpend.ticketPct, facts.comparisonStoresAvgChangePct)
                  : copy.canvas.others(facts.comparisonStoresAvgChangePct)}
              </p>
            ) : (
              <p className="text-lg leading-relaxed text-ink-2">{problem}</p>
            )}
          </div>
          {facts && (
            <div className="pebble self-start px-7 py-6 lg:self-auto">
              <div className="flex items-baseline gap-4">
                <span className="relative">
                  <span className="tabular font-mono text-6xl font-medium tracking-tighter text-crimson sm:text-7xl">
                    {sign(facts.weekdayLunchSalesChangePct)}
                  </span>
                  {facts.anomaly.flagged && (
                    <span className="live-dot absolute -right-3 -top-1 h-3 w-3 rounded-full bg-crimson shadow-[0_0_8px_rgba(163,49,63,0.6)]" aria-hidden />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="font-mono text-sm font-medium uppercase tracking-wider text-crimson">{copy.canvas.kpi}</span>
                  <span className="font-mono text-xs text-muted">{copy.canvas.window}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-line/60 pt-3 font-mono text-xs">
                {facts.anomaly.daysBelowBaselineOfLast7 != null && (
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <span className="h-2 w-2 rounded-full bg-crimson" aria-hidden />
                    {copy.canvas.daysBelow(facts.anomaly.daysBelowBaselineOfLast7)}
                  </span>
                )}
                {facts.gapVsComparisonPts != null && <span className="font-medium text-crimson">{copy.canvas.gap(facts.gapVsComparisonPts)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Workflow control strip */}
        <div className="sculpt-sm glass flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={stageTone[stage]}>{copy.stages[stage]}</Badge>
              {inv?.source === "fallback" && <SampleBadge kind="replay" />}
              {stage === 0 ? (
                <div className="flex shrink-0 overflow-hidden rounded-full border border-line text-xs" role="group" aria-label="Mode">
                  {[
                    { v: true, label: copy.canvas.mode.live },
                    { v: false, label: copy.canvas.mode.replay },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setLive(o.v)}
                      aria-pressed={live === o.v}
                      className={`whitespace-nowrap px-3 py-1 ${live === o.v ? "bg-ink text-paper" : "bg-card text-muted"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="font-mono text-xs text-muted">{live ? copy.canvas.mode.live : copy.canvas.mode.replay}</span>
              )}
            </div>
            <WorkflowPath stage={stage} />
          </div>
          {actionButton}
        </div>
        {error && <p className="chip-alert rounded-2xl px-4 py-3 text-sm text-crimson">✕ {error}</p>}
      </section>

      {/* 01 What changed */}
      {caseData && (
        <section>
          <SectionHead
            eyebrow={copy.canvas.s1.eyebrow}
            title={copy.canvas.s1.title}
            aside={
              <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-4 rounded-full bg-crimson" aria-hidden /> {copy.canvas.s1.legendLine}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-2 border-dashed border-line-strong" aria-hidden /> {copy.canvas.s1.legendPrior}
                </span>
                <SampleBadge />
              </div>
            }
          />
          <div className="sculpt p-5 sm:p-8">
            <Waveform data={caseData.sales} events={caseData.events} />
          </div>
        </section>
      )}

      {/* 02 Agents at work */}
      {hasInv && (
        <section ref={(el) => { anchors.current.investigation = el; }} className="rise-in scroll-mt-24">
          <SectionHead
            eyebrow={copy.canvas.s2.eyebrow}
            title={copy.canvas.s2.title}
            aside={
              r?.verdict && (
                <span className="flex items-center gap-2 text-sm">
                  <span className="label">{copy.details.verdict}</span>
                  <Badge tone="designed">{copy.investigation.verdict[r.verdict.label]}</Badge>
                </span>
              )
            }
          />
          <div className="sculpt sculpt-alt space-y-5 p-4 sm:p-6">
            <AgentTrace steps={steps} done={done} onFinished={onTraceDone} />
            {traceDone && r && (
              <div className="rise-in space-y-5">
                {r.verdict && <p className="text-sm text-ink-2">{r.verdict.reason}</p>}
                <SuspectList hypotheses={r.hypotheses} />
                <PrecedentsPanel />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 03 The gap */}
      {traceDone && r && (
        <div className="rise-in">
          <GapCenterpiece unknown={r.unknown} question={r.question} rationale={r.rationale}>
            {stage === 2 && <div className="flex justify-end">{actionButton}</div>}
          </GapCenterpiece>
        </div>
      )}

      {/* 04 Analytical clash */}
      {stage >= 3 && (
        <section ref={(el) => { anchors.current.study = el; }} className="rise-in scroll-mt-24 space-y-5">
          <SectionHead eyebrow={copy.canvas.s4.eyebrow} title={copy.canvas.s4.title} />
          {study && <FieldingPanel sampleSize={study.sampleSize} onFinished={onFieldDone} />}
          {study && fieldDone && <ClashPanel results={study} />}
          {study && fieldDone && <AdCard results={study} />}
          {noStudy && (
            <div className="sculpt flex flex-col items-center gap-3 p-8 text-center">
              <p className="max-w-md text-ink-2">{copy.study.noStudy}</p>
              <QrBlock url={surveyUrl} size={180} />
            </div>
          )}
          {stage === 4 && decision && <div className="flex justify-end">{actionButton}</div>}
        </section>
      )}

      {/* 05 Decision */}
      {stage >= 5 && decision && (
        <section ref={(el) => { anchors.current.decision = el; }} className="rise-in scroll-mt-24">
          <SectionHead eyebrow={copy.canvas.s5.eyebrow} title={copy.canvas.s5.title} />
          <ActionIsland decision={decision} approved={stage === 6} canApprove={stage === 5} onApprove={approve} />
        </section>
      )}

      {/* Case log */}
      <section className="glass sculpt-sm p-5">
        <p className="label mb-2">{copy.canvas.log}</p>
        <ul className="space-y-1.5 text-sm">
          {activity.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-24 shrink-0 font-mono text-xs text-faint" suppressHydrationWarning>
                {a.at}
              </span>
              <span className="text-ink-2">{a.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

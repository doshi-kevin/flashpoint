"use client";
// "Open Store 51" demo workspace, built for a 30-second live run: type a region, watch the agent work,
// read three big numbers, see the one question, then ask people two ways (QR survey and a tap-to-answer ad).
import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import QrBlock from "@/components/QrBlock";
import SiteDecision from "@/components/SiteDecision";

type Sent = { label: "Observed" | "Inferred" | "Unknown"; text: string };
type Kpis = { population?: number; medianAge?: number; medianIncome?: number; lowConfidence?: boolean };
type Result = {
  region: string;
  economics: string;
  sentiment: Sent[];
  pricing: { low: number; mid: number; high: number };
  question: { text: string; options: string[] };
  recommendation: string;
  kpis?: Kpis | null;
  toolsUsed?: string[];
};
type Step = { step: string; detail: string; source: string };

const tone = { Observed: "good", Inferred: "warn", Unknown: "bad" } as const;
const SURVEY_URL =
  process.env.NEXT_PUBLIC_EXPANSION_SURVEY_URL || "https://flashpointopinions.com/35808758-cecc-4781-b2ea-5d0f4ded0373";
const fmt = (n?: number) => (n == null ? "–" : n.toLocaleString("en-US"));

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="pebble px-6 py-5 text-center">
      <p className="text-4xl font-black tracking-tight sm:text-5xl">{value}</p>
      <p className="label mt-1">{label}</p>
    </div>
  );
}

/** The ad is the survey: one tap is the answer. Counts are local to this screen (concept demo). */
function AdTap({ question, options }: { question: string; options: string[] }) {
  const [taps, setTaps] = useState<number[]>(() => options.map(() => 0));
  const total = taps.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="label !text-ink-2">The ad is the survey</span>
        <Badge tone="sample">Sample ad</Badge>
      </div>
      <div className="mx-auto max-w-xs rounded-md border-2 border-dashed border-ink bg-white p-4 text-center">
        <p className="text-sm font-black leading-tight">{question}</p>
        <div className="mt-3 flex flex-col gap-2">
          {options.map((o, i) => (
            <button
              key={o}
              onClick={() => setTaps((t) => t.map((x, j) => (j === i ? x + 1 : x)))}
              className="flex items-center justify-between rounded-md border border-ink/25 bg-lime px-3 py-2 text-sm font-bold active:scale-95"
            >
              <span>{o}</span>
              <span className="font-mono text-xs">{taps[i]}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-center font-mono text-xs text-muted">
        {total ? `${total} taps = ${total} answers` : "Tap an answer. The tap is the survey."}
      </p>
    </div>
  );
}

export default function ExpansionPage() {
  const [region, setRegion] = useState("Raleigh, North Carolina");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [source, setSource] = useState<"live" | "replay" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSite, setShowSite] = useState(false);
  const [early, setEarly] = useState<{ region: string; kpis: Kpis } | null>(null);

  // Warm Flashpoint (tool list + demographics) while the presenter is talking, so the click is fast.
  useEffect(() => {
    fetch("/api/expansion").catch(() => {});
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    setSteps([]);
    setResult(null);
    setSource(null);
    setShowSite(false);
    setEarly(null);
    try {
      const res = await fetch("/api/expansion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "step") setSteps((s) => [...s, ev]);
          else if (ev.type === "kpis") setEarly({ region: ev.region, kpis: ev.kpis });
          else if (ev.type === "result") {
            setResult(ev.result);
            setSource(ev.source);
          } else if (ev.type === "error") throw new Error(ev.message);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unknown = result?.sentiment.find((x) => x.label === "Unknown");
  const others = result?.sentiment.filter((x) => x.label !== "Unknown") ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2">Store 51</span>
          {source && (
            <span
              className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider ${source === "live" ? "chip" : "chip-alert"}`}
            >
              {source === "live" ? "Live agent" : "Replay"}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-black leading-none tracking-tight sm:text-6xl">Open Store 51?</h1>
        <div className="sculpt glass flex flex-wrap items-end gap-3 p-5">
          <label className="min-w-[240px] flex-1">
            <span className="label">Region</span>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-base font-semibold outline-none focus:border-ink"
            />
          </label>
          <button
            onClick={run}
            disabled={busy}
            className="btn-lime px-7 py-4 text-base font-black tracking-tight text-ink disabled:opacity-50"
          >
            {busy ? "Researching…" : "Research →"}
          </button>
        </div>
      </section>

      {error && <p className="chip-alert p-4 text-sm font-medium">{error}</p>}

      {(busy || (steps.length > 0 && !result)) && (
        <ol className="flex flex-wrap gap-2" aria-label="Agent progress">
          {steps.map((st, i) => (
            <li key={i} className="chip flex items-center gap-2 px-3 py-1.5 text-sm font-bold">
              <span className="h-2 w-2 rounded-full bg-lime-deep" aria-hidden />
              {st.step}
            </li>
          ))}
        </ol>
      )}

      {early && !result && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label="People" value={fmt(early.kpis.population)} />
          <Kpi label="Median income" value={early.kpis.medianIncome ? `$${fmt(early.kpis.medianIncome)}` : "–"} />
          <Kpi label="Median age" value={early.kpis.medianAge != null ? String(early.kpis.medianAge) : "–"} />
        </div>
      )}

      {result && (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black">{result.region}</span>
              {result.toolsUsed?.length ? <Badge tone="info">Flashpoint data</Badge> : null}
              {result.kpis?.lowConfidence && <Badge tone="warn">Low-confidence data</Badge>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi label="People" value={fmt(result.kpis?.population)} />
              <Kpi label="Median income" value={result.kpis?.medianIncome ? `$${fmt(result.kpis.medianIncome)}` : "–"} />
              <Kpi label="Median age" value={result.kpis?.medianAge != null ? String(result.kpis.medianAge) : "–"} />
            </div>
            <p className="text-lg font-semibold text-ink-2">{result.economics}</p>
            <ul className="flex flex-wrap gap-2">
              {others.map((x) => (
                <li key={x.text} className="chip flex items-center gap-2 px-3 py-1.5 text-sm font-semibold">
                  <Badge tone={tone[x.label] ?? "neutral"}>{x.label}</Badge>
                  {x.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="amber-card relative overflow-hidden p-6 sm:p-8">
            <div className="relative space-y-5">
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                &ldquo;The internet doesn&apos;t know.&rdquo;
              </h2>
              {unknown && <p className="text-lg font-semibold text-ink/85">{unknown.text}</p>}
              <div className="glass sculpt-alt space-y-5 p-5 sm:p-6">
                <div>
                  <p className="label !text-ink-2">Ask real people, one question</p>
                  <p className="mt-1 text-2xl font-black leading-tight">{result.question.text}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {result.question.options.map((o) => (
                      <li key={o} className="chip px-4 py-1.5 text-base font-black">
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="truth-card flex justify-center p-4">
                    <QrBlock url={SURVEY_URL} size={150} />
                  </div>
                  <div className="sculpt-sm bg-card/80 p-4">
                    <AdTap question={result.question.text} options={result.question.options} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-center">
            <button onClick={() => setShowSite((s) => !s)} className="chip px-5 py-2 text-sm font-bold">
              {showSite ? "Hide full site analysis" : "Show full site analysis"}
            </button>
          </div>
          {showSite && <SiteDecision />}
        </>
      )}
    </div>
  );
}

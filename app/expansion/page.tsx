"use client";
// "Open Store 51" workspace: an agent researches a new region (economics via Flashpoint, public sentiment),
// names what public data can't answer, designs ONE pricing question, and hands it to real people via a QR link.
import { useState } from "react";
import Badge from "@/components/Badge";
import QrBlock from "@/components/QrBlock";

type Sent = { label: "Observed" | "Inferred" | "Unknown"; text: string };
type Result = {
  region: string;
  economics: string;
  sentiment: Sent[];
  pricing: { low: number; mid: number; high: number };
  question: { text: string; options: string[] };
  recommendation: string;
  toolsUsed?: string[];
};
type Step = { step: string; detail: string; source: string };

const tone = { Observed: "good", Inferred: "warn", Unknown: "bad" } as const;
const SURVEY_URL =
  process.env.NEXT_PUBLIC_EXPANSION_SURVEY_URL || "https://flashpointopinions.com/35808758-cecc-4781-b2ea-5d0f4ded0373";

export default function ExpansionPage() {
  const [region, setRegion] = useState("Raleigh, North Carolina");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [source, setSource] = useState<"live" | "replay" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true); setError(null); setSteps([]); setResult(null); setSource(null);
    try {
      const res = await fetch("/api/expansion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ region }) });
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
          else if (ev.type === "result") { setResult(ev.result); setSource(ev.source); }
          else if (ev.type === "error") throw new Error(ev.message);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unknown = result?.sentiment.find((x) => x.label === "Unknown")?.text;
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2">Expansion dossier</span>
          <span className="text-faint">/</span>
          <span className="chip px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2">Store 51</span>
          {source && (
            <span className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider ${source === "live" ? "chip" : "chip-alert"}`}>
              {source === "live" ? "Live agent" : "Replay"}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-black leading-none tracking-tight sm:text-6xl">Open Store 51</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-2">
          A region you have never visited. The agent researches the economics and public sentiment, then asks real people the one thing the internet can&apos;t answer.
        </p>
        <div className="sculpt glass flex flex-wrap items-end gap-3 p-5">
          <label className="min-w-[240px] flex-1">
            <span className="label">Region for Store 51</span>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-base font-semibold outline-none focus:border-ink"
            />
          </label>
          <button onClick={run} disabled={busy} className="btn-lime px-7 py-4 text-base font-black tracking-tight text-ink disabled:opacity-50">
            {busy ? "Researching…" : "Research this region →"}
          </button>
        </div>
      </section>

      {error && <p className="chip-alert p-4 text-sm font-medium">{error}</p>}

      {steps.length > 0 && (
        <section className="sculpt p-6">
          <p className="label mb-3">Agent at work</p>
          <ol className="space-y-3">
            {steps.map((st, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-lime-deep" aria-hidden />
                <div>
                  <p className="font-bold">{st.step}</p>
                  <p className="text-sm text-ink-2">{st.detail}</p>
                  <p className="font-mono text-xs text-muted">Source: {st.source}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result && (
        <>
          <section className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="label">Section 01 // Economics</span>
              {result.toolsUsed?.length ? <span className="chip px-3 py-1 font-mono text-xs">Flashpoint: {result.toolsUsed.join(", ")}</span> : null}
            </div>
            <div className="pebble p-6 sm:p-8">
              <p className="text-2xl font-black tracking-tight">{result.region}</p>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink-2">{result.economics}</p>
            </div>
          </section>

          <section className="space-y-3">
            <span className="label">Section 02 // Public sentiment</span>
            <div className="sculpt p-6 sm:p-8">
              <ul className="space-y-3">
                {result.sentiment.map((x) => (
                  <li key={x.text} className="flex items-start gap-3">
                    <Badge tone={tone[x.label] ?? "neutral"}>{x.label}</Badge>
                    <span className="text-base leading-relaxed">{x.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="amber-card relative overflow-hidden p-6 sm:p-10">
            <div className="relative space-y-6">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-widest">
                <span className="h-2.5 w-2.5 rounded-full bg-ochre" aria-hidden /> The gap // What only people can tell you
              </span>
              <h2 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                &ldquo;The internet doesn&apos;t know.&rdquo;
              </h2>
              {unknown && <p className="max-w-3xl text-lg font-medium leading-relaxed text-ink/85">{unknown}</p>}
              <div className="glass sculpt-alt grid gap-6 p-5 sm:p-6 md:grid-cols-[1.2fr_1fr]">
                <div className="space-y-3">
                  <p className="label !text-ink-2">The one question for real people</p>
                  <p className="text-2xl font-black leading-tight">{result.question.text}</p>
                  <ul className="flex flex-wrap gap-2">
                    {result.question.options.map((o) => (
                      <li key={o} className="chip px-4 py-1.5 text-sm font-bold">{o}</li>
                    ))}
                  </ul>
                  <p className="font-mono text-xs text-ink-2">
                    Testing ${result.pricing.low} / ${result.pricing.mid} / ${result.pricing.high}
                  </p>
                  <p className="text-sm font-semibold">{result.recommendation}</p>
                </div>
                <div className="truth-card flex justify-center p-5">
                  <QrBlock url={SURVEY_URL} size={170} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

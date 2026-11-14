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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Open Store 51</h1>
        <p className="text-sm text-muted">
          A region you have never visited. The agent researches the economics and public sentiment, then asks real people the one thing the internet can&apos;t answer.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded border border-line bg-panel p-4">
        <label className="flex-1 text-sm">
          <span className="label">Region for Store 51</span>
          <input value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2" />
        </label>
        <button onClick={run} disabled={busy} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
          {busy ? "Researching…" : "Research this region"}
        </button>
      </div>

      {error && <p className="rounded border border-[#f8a98f] bg-[#fff8f5] p-3 text-sm">{error}</p>}

      {steps.length > 0 && (
        <ol className="space-y-2 rounded border border-line bg-panel p-4 text-sm">
          {steps.map((s, i) => (
            <li key={i} className="flex flex-col">
              <span className="font-semibold">{s.step}</span>
              <span className="text-muted">{s.detail}</span>
              <span className="text-xs text-muted">Source: {s.source}</span>
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone={source === "live" ? "good" : "sample"}>{source === "live" ? "Live agent" : "Replay"}</Badge>
            {result.toolsUsed?.length ? <Badge tone="info">Flashpoint: {result.toolsUsed.join(", ")}</Badge> : null}
          </div>
          <section className="rounded border border-line bg-panel p-4">
            <p className="label">Economics</p>
            <p className="mt-1 text-sm">{result.economics}</p>
          </section>
          <section className="space-y-2 rounded border border-line bg-panel p-4">
            <p className="label">Public sentiment</p>
            {result.sentiment.map((s) => (
              <p key={s.text} className="flex items-start gap-2 text-sm">
                <Badge tone={tone[s.label] ?? "neutral"}>{s.label}</Badge>
                <span>{s.text}</span>
              </p>
            ))}
          </section>
          <section className="rounded border border-[#f8a98f] border-l-4 border-l-accent bg-[#fff8f5] p-4">
            <p className="label !text-accent-ink">The internet doesn&apos;t know</p>
            <p className="mt-1 text-base font-semibold">{result.question.text}</p>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {result.question.options.map((o) => (
                <li key={o} className="rounded border border-line bg-white px-3 py-1">{o}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Price range the agent is testing: ${result.pricing.low} / ${result.pricing.mid} / ${result.pricing.high}
            </p>
          </section>
          <section className="grid gap-4 rounded border border-line bg-panel p-4 md:grid-cols-[auto_1fr]">
            <QrBlock url={SURVEY_URL} size={160} />
            <div className="text-sm">
              <p className="label">Ask real people with Flashpoint</p>
              <p className="mt-1">{result.recommendation}</p>
              <p className="mt-2 text-xs text-muted">Scan to answer. Responses are collected by Flashpoint and read back by the agent.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

"use client";
// Main case: Kevin has 50 stores and is opening Store 51. Agents analyse the place (people, weather, inventory, land),
// then ONE question is tested two ways: what people SAY (Flashpoint survey) vs what they DO (coupon ad, tracked by coupon ID).
import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import QrBlock from "@/components/QrBlock";
import SiteDecision from "@/components/SiteDecision";
import caseData from "@/data/store51-case.json";

type Sent = { label: "Observed" | "Inferred" | "Unknown"; text: string };
type Kpis = { population?: number; medianAge?: number; medianIncome?: number; lowConfidence?: boolean };
type Weather = { avgHighF: number; rainyDays: number; days: number };
type Result = {
  region: string;
  economics: string;
  sentiment: Sent[];
  recommendation: string;
  question: { text: string; options: string[] };
  kpis?: Kpis | null;
  weather?: Weather | null;
};
type Step = { step: string; detail: string; source: string };
type Coupon = { code: string; arm: 0 | 1; redeemed: boolean };

const tone = { Observed: "good", Inferred: "warn", Unknown: "bad" } as const;
const SURVEY_URL =
  process.env.NEXT_PUBLIC_EXPANSION_SURVEY_URL || "https://flashpointopinions.com/800687db-aa78-416c-a0c1-70d4bb35d2e7";
const fmt = (n?: number) => (n == null ? "–" : n.toLocaleString("en-US"));
const usd = (n: number) => `$${n.toFixed(2)}`;
const { fleet, unit, land, say, prices } = caseData;
const marginPer = prices.map((p) => p - unit.cheeseCost);
const OFFERS_PER_DAY = 300; // illustrative assumption: cheese offers per store per day

function AgentCard({ name, source, live, children }: { name: string; source: string; live: boolean; children: React.ReactNode }) {
  return (
    <div className="sculpt-sm bg-card/90 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label !text-ink-2">{name}</p>
        <Badge tone={live ? "good" : "sample"}>{live ? "Live" : "Sample"}</Badge>
      </div>
      <div className="mt-2 text-2xl font-black leading-tight">{children}</div>
      <p className="mt-1 font-mono text-xs text-muted">{source}</p>
    </div>
  );
}

function Bars({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  return (
    <ul className="space-y-2">
      {labels.map((l, i) => (
        <li key={l}>
          <div className="flex justify-between text-sm font-bold">
            <span>{l}</span>
            <span className="font-mono">{values[i]}%</span>
          </div>
          <div className="h-3 rounded-full bg-soft">
            <div className={`h-3 rounded-full ${color}`} style={{ width: `${values[i]}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ExpansionPage() {
  const [region, setRegion] = useState("Raleigh, North Carolina");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [early, setEarly] = useState<{ kpis: Kpis } | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [source, setSource] = useState<"live" | "replay" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSite, setShowSite] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Warm Flashpoint (tool list + demographics) while the presenter is talking, so the click is fast.
  useEffect(() => {
    fetch("/api/expansion").catch(() => {});
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    setSteps([]);
    setResult(null);
    setEarly(null);
    setWeather(null);
    setSource(null);
    setShowSite(false);
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
          else if (ev.type === "kpis") setEarly({ kpis: ev.kpis });
          else if (ev.type === "weather") setWeather(ev.weather);
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

  // The ad: a tap issues a coupon with its own ID; redeeming that coupon at the register is the conversion.
  // Which single price the NEXT person is shown. Random assignment, so the price is the only thing that differs.
  const [shown, setShown] = useState<0 | 1 | null>(null);
  const nextPerson = () => setShown(Math.random() < 0.5 ? 0 : 1);
  function tap(arm: 0 | 1) {
    const code = `EMB51-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setCoupons((c) => [{ code, arm, redeemed: false }, ...c].slice(0, 40));
    setShown(null);
  }
  const redeem = (code: string) => setCoupons((c) => c.map((x) => (x.code === code ? { ...x, redeemed: true } : x)));

  const k = result?.kpis ?? early?.kpis ?? null;
  const w = result?.weather ?? weather;
  const issued = [0, 1].map((a) => caseData.do.issued[a] + coupons.filter((c) => c.arm === a).length);
  const redeemed = [0, 1].map((a) => caseData.do.redeemed[a] + coupons.filter((c) => c.arm === a && c.redeemed).length);
  const rate = [0, 1].map((a) => redeemed[a] / issued[a]);
  const profit100 = [0, 1].map((a) => rate[a] * 100 * marginPer[a]);
  const winner = profit100[1] > profit100[0] ? 1 : 0;
  const gainPerPerson = Math.abs(profit100[1] - profit100[0]) / 100;
  const yearly = Math.round((gainPerPerson * OFFERS_PER_DAY * 365 * fleet.stores) / 1000) * 1000;
  const showCase = busy || result || early;
  const unknown = result?.sentiment.find((x) => x.label === "Unknown");
  const others = result?.sentiment.filter((x) => x.label !== "Unknown") ?? [];
  const q = result?.question ?? caseData.question;

  return (
    <div className="space-y-8">
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2">Case EP-51</span>
          {source && (
            <span className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider ${source === "live" ? "chip" : "chip-alert"}`}>
              {source === "live" ? "Live agents" : "Replay"}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-black leading-none tracking-tight sm:text-6xl">Kevin opens Store 51</h1>
        <p className="text-lg font-semibold text-ink-2">50 stores today. A new city. What do people want, and what will they actually do?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="chip px-4 py-2 text-center"><span className="text-2xl font-black">{fleet.stores}</span> <span className="label">stores</span></div>
          <div className="chip px-4 py-2 text-center"><span className="text-2xl font-black">{usd(fleet.avgTicket)}</span> <span className="label">avg ticket</span></div>
          <div className="chip px-4 py-2 text-center"><span className="text-2xl font-black">{fleet.grossMarginPct}%</span> <span className="label">gross margin</span></div>
        </div>
        <p className="font-mono text-xs text-muted">Sample unit economics (designed assumptions)</p>
        <div className="sculpt glass flex flex-wrap items-end gap-3 p-5">
          <label className="min-w-[240px] flex-1">
            <span className="label">Where is Store 51?</span>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 text-base font-semibold outline-none focus:border-ink"
            />
          </label>
          <button onClick={run} disabled={busy} className="btn-lime px-7 py-4 text-base font-black tracking-tight text-ink disabled:opacity-50">
            {busy ? "Agents working…" : "Investigate →"}
          </button>
        </div>
      </section>

      {error && <p className="chip-alert p-4 text-sm font-medium">{error}</p>}

      {showCase && (
        <section className="space-y-3">
          <p className="label">Agents</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AgentCard name="Land and people" source="Flashpoint demographics" live>
              {k ? (
                <>
                  {fmt(k.population)} <span className="text-base font-bold text-ink-2">people</span>
                  <div className="text-base font-bold text-ink-2">
                    {k.medianIncome ? `$${fmt(k.medianIncome)} income` : ""} · age {k.medianAge ?? "–"}
                  </div>
                </>
              ) : (
                <span className="text-muted">…</span>
              )}
            </AgentCard>
            <AgentCard name="Weather" source="Open-Meteo, next 14 days" live>
              {w ? (
                <>
                  {w.avgHighF}°F <span className="text-base font-bold text-ink-2">avg high</span>
                  <div className="text-base font-bold text-ink-2">{w.rainyDays} rainy days</div>
                </>
              ) : (
                <span className="text-muted">{result ? "n/a" : "…"}</span>
              )}
            </AgentCard>
            <AgentCard name="Inventory" source={unit.label} live={false}>
              Cheese costs {usd(unit.cheeseCost)}
              <div className="text-base font-bold text-ink-2">
                Margin {usd(marginPer[0])} at $1 · {usd(marginPer[1])} at $1.50
              </div>
            </AgentCard>
            <AgentCard name="Land cost" source={land.label} live={false}>
              ${land.rentPerSqft}
              <span className="text-base font-bold text-ink-2"> / sq ft / yr</span>
            </AgentCard>
            <AgentCard name="Customers" source="Flashpoint survey + coupon ad" live>
              {result ? "Question ready" : "…"}
              {result?.kpis?.lowConfidence && <div className="text-base font-bold text-ink-2">Data flagged low confidence</div>}
            </AgentCard>
          </div>
          {result && (
            <>
              <p className="text-lg font-semibold text-ink-2">{result.economics}</p>
              <ul className="flex flex-wrap gap-2">
                {others.map((x) => (
                  <li key={x.text} className="chip flex items-center gap-2 px-3 py-1.5 text-sm font-semibold">
                    <Badge tone={tone[x.label] ?? "neutral"}>{x.label}</Badge>
                    {x.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {result && (
        <section className="amber-card relative overflow-hidden p-6 sm:p-8">
          <div className="relative space-y-5">
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">&ldquo;The internet doesn&apos;t know.&rdquo;</h2>
            {unknown && <p className="text-lg font-semibold text-ink/85">{unknown.text}</p>}
            <p className="text-2xl font-black leading-tight">{q.text}</p>

            <div className="grid gap-5 md:grid-cols-2">
              {/* SAY */}
              <div className="glass sculpt-alt space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black">What they SAY</p>
                  <Badge tone="sample">Sample answers</Badge>
                </div>
                <Bars labels={q.options} values={say.pct} color="bg-muted/60" />
                <div className="truth-card flex justify-center p-3">
                  <QrBlock url={SURVEY_URL} size={120} />
                </div>
              </div>

              {/* DO */}
              <div className="glass sculpt-alt space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black">What they DO</p>
                  <Badge tone="sample">Sample ad</Badge>
                </div>
                <p className="text-sm font-semibold text-ink-2">
                  Each person sees <b>one</b> price, picked at random. They never choose between prices. We count who actually pays it.
                </p>
                <div className="mx-auto max-w-xs rounded-md border-2 border-dashed border-ink bg-white p-4 text-center">
                  {shown === null ? (
                    <button onClick={nextPerson} className="w-full rounded-md border border-ink/25 bg-soft px-3 py-3 text-base font-black active:scale-95">
                      Show the ad to the next person
                    </button>
                  ) : (
                    <>
                      <p className="text-sm font-black leading-tight">Extra cheese near Store 51. Show this code at the register.</p>
                      <p className="my-2 text-4xl font-black">{usd(prices[shown])}</p>
                      <button onClick={() => tap(shown)} className="w-full rounded-md border border-ink/25 bg-lime px-3 py-3 text-lg font-black active:scale-95">
                        Get my code
                      </button>
                    </>
                  )}
                </div>
                {coupons.length > 0 && (
                  <ul className="max-h-28 space-y-1 overflow-auto">
                    {coupons.slice(0, 4).map((c) => (
                      <li key={c.code} className="flex items-center justify-between rounded border border-line bg-card px-3 py-1 font-mono text-xs">
                        <span>{c.code} · {usd(prices[c.arm])}</span>
                        {c.redeemed ? (
                          <span className="font-bold text-moss">Paid ✓</span>
                        ) : (
                          <button onClick={() => redeem(c.code)} className="font-bold underline">Pays at register</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <table className="w-full text-left text-sm">
                  <thead className="label">
                    <tr><th>Price</th><th>Paid</th><th>Rate</th><th>Profit per 100 shown</th></tr>
                  </thead>
                  <tbody className="font-bold">
                    {[0, 1].map((a) => (
                      <tr key={a} className={winner === a ? "text-moss" : ""}>
                        <td>{usd(prices[a])}</td>
                        <td className="font-mono">{redeemed[a]}/{issued[a]}</td>
                        <td className="font-mono">{Math.round(rate[a] * 100)}%</td>
                        <td className="font-mono">{usd(profit100[a])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="font-mono text-xs text-muted">Not a discount: the code holds the price. Paying it at the register is a real purchase, traced by ID.</p>
              </div>
            </div>

            <div className="glass sculpt-sm p-4 text-center">
              <p className="text-xl font-black">
                They SAY {q.options[0]} ({say.pct[0]}%). They DO pay {usd(prices[winner])}, and it earns {usd(profit100[winner])} per 100 people shown the ad.
              </p>
              <p className="mt-3 text-5xl font-black tracking-tight text-moss">${yearly.toLocaleString("en-US")} <span className="text-2xl text-ink-2">per year</span></p>
              <p className="font-mono text-xs text-muted">
                {usd(gainPerPerson)} per person × {OFFERS_PER_DAY} a day × 365 days × {fleet.stores} stores. Illustration from sample numbers.
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-2">{result.recommendation}</p>
            </div>
          </div>
        </section>
      )}

      {result && (
        <>
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

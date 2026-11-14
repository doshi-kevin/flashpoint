// Cases list (home). Cases are auto-detected from store data by the anomaly rule (lib/metrics.ts).
// Below it, a store-health table for all stores. Everything here is computed in code from /data.
import Link from "next/link";
import Badge from "@/components/Badge";
import SampleBadge from "@/components/SampleBadge";
import AgentTag from "@/components/AgentTag";
import { sign } from "@/components/CaseFacts";
import { getStores, getSales } from "@/lib/data";
import { anomaly, salesChangePct } from "@/lib/metrics";
import { copy } from "@/content/copy";

export default function CasesPage() {
  const rows = getStores().map((s) => {
    const sales = getSales(s.id);
    return { store: s, change: salesChangePct(sales), flagged: anomaly(sales).flagged };
  });
  const cases = rows.filter((r) => r.flagged);
  const th = "px-4 py-2.5 font-medium";
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{copy.cases.title}</h1>
          <p className="text-ink-2">{copy.cases.sub}</p>
        </div>
        <SampleBadge />
      </div>

      <Link href="/expansion" className="amber-card block p-6 transition hover:-translate-y-0.5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="label !text-ink-2">Featured case · EP-51</p>
            <p className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Kevin opens Store 51</p>
            <p className="font-semibold text-ink/85">What do people want near the store, and what will they actually do?</p>
          </div>
          <span className="btn-lime px-6 py-3 text-base font-black text-ink">Open case →</span>
        </div>
      </Link>

      <div className="sculpt overflow-x-auto px-2 py-1">
        <table className="w-full text-left text-sm">
          <thead className="label border-b border-line">
            <tr>
              <th className={th}>{copy.cases.cols.key}</th>
              <th className={th}>{copy.cases.cols.summary}</th>
              <th className={th}>{copy.cases.cols.store}</th>
              <th className={th}>{copy.cases.cols.signal}</th>
              <th className={th}>{copy.cases.cols.status}</th>
              <th className={th}>{copy.cases.cols.source}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cases.map((c) => (
              <tr key={c.store.id} className="hover:bg-soft/60">
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-medium">
                  <Link href={`/case/${c.store.id}`} className="underline decoration-ink/40 underline-offset-4 hover:decoration-ink">
                    EP-{c.store.id}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/case/${c.store.id}`} className="font-bold hover:underline">
                    Weekday lunch sales {sign(c.change)} at {c.store.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-ink-2">
                  {c.store.name} · {c.store.area}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-base font-medium text-crimson">
                  <span aria-hidden className="mr-1 text-xs">
                    ▼
                  </span>
                  {sign(c.change)}
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone="neutral">{copy.stages[0]}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  <AgentTag agent="Code" />
                  <span className="ml-2 text-ink-2">{copy.cases.detectedBy}</span>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No open cases.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">{copy.cases.stores}</h2>
        <div className="sculpt overflow-x-auto px-2 py-1">
          <table className="w-full text-left text-sm">
            <thead className="label border-b border-line">
              <tr>
                <th className={th}>{copy.cases.storeCols.store}</th>
                <th className={th}>{copy.cases.storeCols.area}</th>
                <th className={th}>{copy.cases.storeCols.change}</th>
                <th className={th}>{copy.cases.storeCols.state}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.store.id}>
                  <td className="px-4 py-2.5 font-semibold">{r.store.name}</td>
                  <td className="px-4 py-2.5 text-ink-2">{r.store.area}</td>
                  <td className={`px-4 py-2.5 font-mono text-sm ${r.flagged ? "font-medium text-crimson" : ""}`}>
                    <span aria-hidden className="mr-1 text-xs">
                      {r.change < 0 ? "▼" : "▲"}
                    </span>
                    {sign(r.change)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.flagged ? "bad" : "good"}>
                      <span aria-hidden>{r.flagged ? "●" : "✓"}</span> {r.flagged ? copy.cases.attention : copy.cases.normal}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Cases list (home). Cases are auto-detected from store data by the anomaly rule (lib/metrics.ts).
// Below it, a store-health table for all stores. Everything here is computed in code from /data.
import Link from "next/link";
import Badge from "@/components/Badge";
import SampleBadge from "@/components/SampleBadge";
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
  const th = "px-4 py-2 font-semibold";

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{copy.cases.title}</h1>
          <p className="text-sm text-muted">{copy.cases.sub}</p>
        </div>
        <SampleBadge />
      </div>

      <div className="overflow-x-auto rounded border border-line bg-panel">
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
              <tr key={c.store.id} className="hover:bg-soft">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/case/${c.store.id}`} className="text-info hover:underline">
                    EP-{c.store.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/case/${c.store.id}`} className="font-medium hover:underline">
                    Weekday lunch sales {sign(c.change)} at {c.store.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {c.store.name} · {c.store.area}
                </td>
                <td className="px-4 py-3 font-semibold text-accent-ink">{sign(c.change)}</td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{copy.stages[0]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{copy.cases.detectedBy}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No open cases.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold">{copy.cases.stores}</h2>
        <div className="overflow-x-auto rounded border border-line bg-panel">
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
                  <td className="px-4 py-2.5 font-medium">{r.store.name}</td>
                  <td className="px-4 py-2.5 text-muted">{r.store.area}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{sign(r.change)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.flagged ? "bad" : "good"}>{r.flagged ? copy.cases.attention : copy.cases.normal}</Badge>
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

// "The ad is the survey" concept card (mock). A display ad aimed near the store at lapsed customers;
// the tap is the answer. Tap counts are derived from the saved "real people" percentages. Concept only:
// Flashpoint Market Experiments is unverified and this is not an ad revenue business.
import Badge from "./Badge";
import type { StudyResults } from "@/lib/types";

export default function AdCard({ results }: { results: StudyResults }) {
  const taps = results.options.map((_, i) => Math.round((results.real[i] / 100) * results.sampleSize));
  return (
    <div className="space-y-3 rounded-2xl border border-line/80 bg-card/85 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label">The ad is the survey</p>
        <div className="flex gap-1">
          <Badge tone="sample">Sample ad</Badge>
          <Badge tone="designed">Concept</Badge>
        </div>
      </div>
      <p className="text-sm text-ink-2">
        A display ad near the store, shown to people who stopped visiting. One tap is the answer, so nobody feels
        surveyed. The reward is the experiment: offers are randomly assigned and redemption is the data. We measure
        behavior, not stars.
      </p>
      <div className="mx-auto max-w-sm rounded-md border-2 border-dashed border-ink p-4 text-center">
        <p className="text-base font-semibold">We miss you at Ember Burger on Harbor St. What would bring you back?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {results.options.map((o, i) => (
            <span key={o} className="rounded-md border border-ink/25 bg-lime px-3 py-1.5 text-sm font-semibold">
              {o} <span className="ml-1 font-mono text-xs text-ink-2">{taps[i]} taps</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">Taps feed the &quot;Real people said&quot; column above (sample data).</p>
    </div>
  );
}

// Before -> After recommendation with owner, success metric and review date. Props: decision (Decision).
import FlashpointMark from "./FlashpointMark";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function DecisionBanner({ decision: d }: { decision: Decision }) {
  return (
    <div className="space-y-5">
      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1.15fr]">
        <div className="rounded-md border border-line bg-paper p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="label">{copy.decision.before}</p>
            <SampleBadge kind="synthetic" />
          </div>
          <p className="text-xl font-extrabold text-muted line-through decoration-crimson/70 decoration-2">{d.before.title}</p>
          <p className="mt-2 text-sm text-ink-2">{d.before.why}</p>
        </div>
        <div className="hidden items-center text-3xl text-muted md:flex" aria-hidden="true">
          →
        </div>
        <div className="rounded-md border-2 border-ink bg-panel p-5 shadow-[0_10px_30px_-18px_rgba(28,27,24,0.45)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="label !text-ink">{copy.decision.after}</p>
            <FlashpointMark />
          </div>
          <p className="text-xl font-extrabold">
            <span className="marker">{d.after.title}</span>
          </p>
          <p className="mt-2 text-sm text-ink-2">{d.after.why}</p>
        </div>
      </div>
      <dl className="grid divide-y divide-line rounded-md border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          [copy.decision.owner, d.owner],
          [copy.decision.metric, d.metric],
          [copy.decision.review, d.reviewDate],
        ].map(([k, v]) => (
          <div key={k} className="space-y-1 p-4">
            <dt className="label">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

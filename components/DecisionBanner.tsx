// Before -> After recommendation with owner, success metric and review date. Props: decision (Decision).
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function DecisionBanner({ decision: d }: { decision: Decision }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-line bg-panel p-4">
          <p className="label">{copy.decision.before}</p>
          <p className="mt-1 text-base text-muted line-through">{d.before.title}</p>
          <p className="mt-1 text-sm text-muted">{d.before.why}</p>
        </div>
        <div className="rounded border border-good/40 border-l-4 border-l-good bg-[#f3fff9] p-4">
          <p className="label">{copy.decision.after}</p>
          <p className="mt-1 text-base font-semibold">{d.after.title}</p>
          <p className="mt-1 text-sm text-muted">{d.after.why}</p>
        </div>
      </div>
      <dl className="grid gap-3 rounded border border-line bg-panel p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="label">{copy.decision.owner}</dt>
          <dd className="mt-0.5">{d.owner}</dd>
        </div>
        <div>
          <dt className="label">{copy.decision.metric}</dt>
          <dd className="mt-0.5">{d.metric}</dd>
        </div>
        <div>
          <dt className="label">{copy.decision.review}</dt>
          <dd className="mt-0.5">{d.reviewDate}</dd>
        </div>
      </dl>
    </div>
  );
}

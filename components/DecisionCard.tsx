// Before-vs-after recommendation with owner, metric, review date. Props: decision (Decision).
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function DecisionCard({ decision: d }: { decision: Decision }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">{copy.decision.before}</p>
          <h3 className="my-1 text-lg font-semibold line-through">{d.before.title}</h3>
          <p className="text-sm text-gray-600">{d.before.why}</p>
        </div>
        <div className="rounded border-2 border-green-500 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">{copy.decision.after}</p>
          <h3 className="my-1 text-lg font-semibold">{d.after.title}</h3>
          <p className="text-sm text-gray-600">{d.after.why}</p>
        </div>
      </div>
      <dl className="grid gap-4 text-sm md:grid-cols-3">
        <div>
          <dt className="text-gray-500">{copy.decision.owner}</dt>
          <dd className="font-medium">{d.owner}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{copy.decision.metric}</dt>
          <dd className="font-medium">{d.metric}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{copy.decision.review}</dt>
          <dd className="font-medium">{d.reviewDate}</dd>
        </div>
      </dl>
    </div>
  );
}

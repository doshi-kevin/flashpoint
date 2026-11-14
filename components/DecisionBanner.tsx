// Before -> After recommendation, owner and review date. Props: decision (Decision).
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function DecisionBanner({ decision: d }: { decision: Decision }) {
  return (
    <div className="space-y-3">
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">{copy.decide.before}</p>
          <p className="text-lg font-semibold text-gray-500 line-through">{d.before.title}</p>
        </div>
        <div className="flex items-center justify-center text-2xl" aria-hidden>
          →
        </div>
        <div className="rounded border-2 border-green-600 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">{copy.decide.after}</p>
          <p className="text-lg font-bold">{d.after.title}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        <strong>{copy.decide.owner}:</strong> {d.owner} · <strong>{copy.decide.review}:</strong> {d.reviewDate}
      </p>
    </div>
  );
}

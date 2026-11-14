// Before -> After recommendation, owner and review date. Props: decision (Decision).
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function DecisionBanner({ decision: d }: { decision: Decision }) {
  return (
    <div className="space-y-3">
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-line bg-soft p-4">
          <p className="eyebrow">{copy.decide.before}</p>
          <p className="mt-1 text-lg text-muted line-through">{d.before.title}</p>
        </div>
        <div className="flex items-center justify-center text-2xl text-accent" aria-hidden>
          →
        </div>
        <div className="rounded-xl border-2 border-accent bg-accent/10 p-4">
          <p className="eyebrow">{copy.decide.after}</p>
          <p className="mt-1 font-serif text-xl font-semibold">{d.after.title}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        <strong className="text-fg">{copy.decide.owner}:</strong> {d.owner} ·{" "}
        <strong className="text-fg">{copy.decide.review}:</strong> {d.reviewDate}
      </p>
    </div>
  );
}

// The decision as an action island: the new action, what it replaces, owner / success metric / review date,
// and the approve button. Props: decision (Decision), approved (bool), canApprove (bool), onApprove.
import Badge from "./Badge";
import FlashpointMark from "./FlashpointMark";
import { copy } from "@/content/copy";
import type { Decision } from "@/lib/types";

export default function ActionIsland({
  decision: d,
  approved,
  canApprove,
  onApprove,
}: {
  decision: Decision;
  approved: boolean;
  canApprove: boolean;
  onApprove: () => void;
}) {
  return (
    <section className="sculpt space-y-6 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-moss/25 bg-gradient-to-br from-moss/10 to-lime/25 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-moss">
              {copy.canvas.actionChip}
            </span>
            <FlashpointMark />
          </div>
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{d.after.title}</h3>
          <p className="text-ink-2">{d.after.why}</p>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink-2">{copy.canvas.instead}: </span>
            <span className="line-through decoration-crimson/60">{d.before.title}</span> · {d.before.why}
          </p>
        </div>
        <dl className="grid gap-3">
          {[
            [copy.decision.owner, d.owner],
            [copy.decision.metric, d.metric],
            [copy.decision.review, d.reviewDate],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-2xl px-4 py-3">
              <dt className="label">{k}</dt>
              <dd className="mt-0.5 font-semibold leading-snug">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/70 pt-5">
        {approved ? (
          <Badge tone="good">
            <span aria-hidden>✓</span> {copy.canvas.approved}
          </Badge>
        ) : (
          <span className="text-sm text-muted">Approving logs the decision with its owner and review date.</span>
        )}
        <button onClick={onApprove} disabled={!canApprove || approved} className="btn-lime flex items-center gap-2 px-7 py-4 text-base font-black tracking-tight">
          {approved ? copy.canvas.approved : copy.canvas.approve}
          {!approved && <span aria-hidden>→</span>}
        </button>
      </div>
    </section>
  );
}

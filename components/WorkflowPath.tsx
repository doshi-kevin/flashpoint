// The 7-stage case workflow shown as a path, like a real tracker. Props: stage (0-6, the current stage).
// Done = filled ink with a check, current = lime with an outline, upcoming = hollow.
import { copy } from "@/content/copy";

export default function WorkflowPath({ stage }: { stage: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 py-1" aria-label="Case workflow">
      {copy.stages.map((label, i) => {
        const done = i < stage;
        const current = i === stage;
        return (
          <li key={label} className="flex shrink-0 items-center" aria-current={current ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] font-bold ${
                  done
                    ? "border-ink bg-ink text-paper"
                    : current
                      ? "border-ink bg-lime text-ink ring-2 ring-ink/20"
                      : "border-line-strong bg-card text-muted"
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`whitespace-nowrap font-mono text-xs uppercase tracking-wide ${
                  current ? "font-medium text-ink" : done ? "text-ink-2" : "text-muted"
                }`}
              >
                {label}
              </span>
            </span>
            {i < copy.stages.length - 1 && (
              <span className={`mx-2 h-px w-3 sm:w-5 ${done ? "bg-ink" : "bg-line-strong"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

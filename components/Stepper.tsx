// Progress bar at the top of the dashboard. Props: step (1-4, the current step).
import { copy } from "@/content/copy";

export default function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {copy.steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                active
                  ? "border-accent bg-accent text-ink"
                  : done
                    ? "border-cream/40 text-cream"
                    : "border-line text-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : n}
            </span>
            <span className={active ? "font-semibold" : "text-muted"}>{label}</span>
            {n < 4 && <span className="mx-1 text-line">—</span>}
          </li>
        );
      })}
    </ol>
  );
}

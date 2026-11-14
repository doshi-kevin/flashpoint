// Progress dots at the top of the dashboard. Props: step (1-4, the current step).
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
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                active ? "bg-black text-white" : done ? "bg-gray-400 text-white" : "bg-gray-200 text-gray-600"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : n}
            </span>
            <span className={active ? "font-semibold" : "text-gray-500"}>{label}</span>
            {n < 4 && <span className="mx-1 text-gray-300">—</span>}
          </li>
        );
      })}
    </ol>
  );
}

// Public signals list. Props: signals (Signal[]). Each is labeled Observed / Inferred / Unknown.
import Badge from "./Badge";
import SampleBadge from "./SampleBadge";
import { copy } from "@/content/copy";
import type { Signal } from "@/lib/types";

const tone = { Observed: "good", Inferred: "warn", Unknown: "bad" } as const;

export default function SignalsPanel({ signals }: { signals: Signal[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-semibold">{copy.investigate.signals}</h3>
        <SampleBadge />
      </div>
      <ul className="space-y-2">
        {signals.map((s) => (
          <li key={s.id} className="rounded border border-gray-200 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{s.source}</span>
              <Badge tone={tone[s.label]}>{s.label}</Badge>
            </div>
            {s.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

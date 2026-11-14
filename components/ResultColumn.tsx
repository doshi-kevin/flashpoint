// One results panel (bars per option). Props: title, options (string[]), values (% per option),
// highlightIndex (optional, e.g. the winning option), variant ("synthetic" = grey hatched, "real" = lime).
import SampleBadge from "./SampleBadge";

export default function ResultColumn({
  title,
  options,
  values,
  highlightIndex,
  variant = "real",
  badge,
}: {
  title: string;
  options: string[];
  values: number[];
  highlightIndex?: number;
  variant?: "synthetic" | "real";
  badge?: "synthetic" | "real" | "live" | "replay";
}) {
  const real = variant === "real";
  return (
    <div className={`rounded-md border ${real ? "border-ink bg-panel" : "border-line bg-paper"}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h3 className="label">{title}</h3>
        <SampleBadge kind={badge ?? variant} />
      </div>
      <ul className="space-y-4 p-4">
        {options.map((o, i) => {
          const top = i === highlightIndex;
          return (
            <li key={o}>
              <div className="flex justify-between gap-2 text-sm">
                <span className={top ? "font-bold" : "text-ink-2"}>{o}</span>
                <span className="font-mono text-xs">{values[i]}%</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-sm bg-line" role="img" aria-label={`${o}: ${values[i]}%`}>
                <div
                  className={`h-3 ${real ? "bg-lime ring-1 ring-inset ring-ink/40" : "hatch"}`}
                  style={{ width: `${values[i]}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

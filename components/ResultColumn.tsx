// One results panel (bars per option). Props: title, options (string[]), values (% per option),
// highlightIndex (optional, e.g. the winning option).
export default function ResultColumn({
  title,
  options,
  values,
  highlightIndex,
}: {
  title: string;
  options: string[];
  values: number[];
  highlightIndex?: number;
}) {
  return (
    <div className="rounded border border-line bg-panel">
      <h3 className="label border-b border-line px-4 py-2">{title}</h3>
      <ul className="space-y-3 p-4">
        {options.map((o, i) => (
          <li key={o}>
            <div className="flex justify-between text-sm">
              <span className={i === highlightIndex ? "font-semibold" : "text-muted"}>{o}</span>
              <span className="font-mono text-xs">{values[i]}%</span>
            </div>
            <div className="mt-1 h-2 rounded bg-soft">
              <div
                className={`h-2 rounded ${i === highlightIndex ? "bg-accent" : "bg-muted/50"}`}
                style={{ width: `${values[i]}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

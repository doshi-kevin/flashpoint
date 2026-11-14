// One results column (bars per option). Props: title, options (string[]), values (% per option),
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
    <div className="rounded-lg border border-line bg-panel p-5">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      <ul className="space-y-4">
        {options.map((o, i) => (
          <li key={o}>
            <div className="flex justify-between text-sm">
              <span className={i === highlightIndex ? "font-semibold" : "text-muted"}>{o}</span>
              <span className="font-mono">{values[i]}%</span>
            </div>
            <div className="mt-1 h-3 rounded bg-line">
              <div
                className={`h-3 rounded ${i === highlightIndex ? "bg-accent" : "bg-muted/60"}`}
                style={{ width: `${values[i]}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

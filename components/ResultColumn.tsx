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
    <div className="rounded border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <ul className="space-y-3">
        {options.map((o, i) => (
          <li key={o}>
            <div className="flex justify-between text-sm">
              <span className={i === highlightIndex ? "font-bold" : ""}>{o}</span>
              <span>{values[i]}%</span>
            </div>
            <div className="h-3 rounded bg-gray-100">
              <div
                className={`h-3 rounded ${i === highlightIndex ? "bg-black" : "bg-gray-400"}`}
                style={{ width: `${values[i]}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

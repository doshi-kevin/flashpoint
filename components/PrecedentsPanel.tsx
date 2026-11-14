// "News & precedents" panel (mock data, concept). Local signals labeled Observed / Inferred / Unknown,
// then historical precedents labeled "Analogy, not proof". No external API is called.
import Badge from "./Badge";

const signals = [
  { label: "Observed", text: "Roadworks near the Store 14 entrance on the affected days." },
  { label: "Observed", text: "Rain on several of the days sales dipped." },
  { label: "Inferred", text: "A competitor lunch offer nearby may be pulling the lunch crowd." },
  { label: "Unknown", text: "Why customers who stopped visiting did not come back. The internet doesn't know." },
] as const;

const precedents = [
  {
    name: "McDonald's Arch Deluxe (1996)",
    worked: "Research said adults wanted a grown-up burger.",
    why: "It flopped. Stated preference is not behavior.",
    different: "We ask about a small change, not a new product line.",
    test: "Randomly give out extra cheese or a $1 coupon and count redemptions.",
  },
  {
    name: "New Coke (1985)",
    worked: "Taste tests favored it.",
    why: "The launch failed. A sip test misses what people do day to day.",
    different: "Our answer comes from a tap in context, not a taste test.",
    test: "Compare what people say with what they redeem.",
  },
  {
    name: "Subway $5 Footlong (2008 recession)",
    worked: "A simple value offer for value-seeking customers.",
    why: "Price was the clear reason people stayed away.",
    different: "Store 14's lost customers may care about line speed more than price.",
    test: "Test $1 off against a faster line in the same week.",
  },
  {
    name: "Domino's (2009)",
    worked: "Admitted customers disliked the pizza and rebuilt the recipe.",
    why: "It asked the people who had left.",
    different: "We reach lapsed customers with one question, not a campaign.",
    test: "Ask lapsed customers one question and act on the top answer.",
  },
];

const tone = { Observed: "good", Inferred: "warn", Unknown: "bad" } as const;

export default function PrecedentsPanel() {
  return (
    <div className="space-y-3 rounded border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label">News and precedents</p>
        <Badge tone="sample">Sample data</Badge>
      </div>
      <ul className="space-y-2">
        {signals.map((s) => (
          <li key={s.text} className="flex items-start gap-2 text-sm">
            <Badge tone={tone[s.label]}>{s.label}</Badge>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 pt-1">
        <p className="label">Precedents</p>
        <Badge tone="neutral">Analogy, not proof</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {precedents.map((p) => (
          <div key={p.name} className="rounded border border-line p-3 text-sm">
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1"><span className="font-medium">What happened:</span> {p.worked}</p>
            <p><span className="font-medium">Why:</span> {p.why}</p>
            <p><span className="font-medium">What&apos;s different today:</span> {p.different}</p>
            <p><span className="font-medium">Testable here:</span> {p.test}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

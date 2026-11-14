// Small pill label. Props: children (text), tone ("neutral" | "sample" | "good" | "warn" | "bad").
// A dot plus the word means status is never shown by colour alone.
const tones = {
  neutral: "border-line text-muted bg-soft",
  sample: "border-accent/40 text-accent-ink bg-accent/10",
  good: "border-good/30 text-good bg-good/10",
  warn: "border-warn/30 text-warn bg-warn/10",
  bad: "border-accent/40 text-accent-ink bg-accent/10",
};

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

// Small pill label. Props: children (text), tone ("neutral" | "sample" | "good" | "warn" | "bad").
// A dot plus the word means status is never shown by colour alone.
const tones = {
  neutral: "border-line text-muted",
  sample: "border-accent/50 text-accent",
  good: "border-good/50 text-good",
  warn: "border-warn/50 text-warn",
  bad: "border-accent/50 text-accent",
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

// Status lozenge (Jira style). Props: children (text), tone ("neutral" | "info" | "sample" | "good" | "warn" | "bad").
// Always uppercase words, so status is never shown by colour alone.
const tones = {
  neutral: "bg-soft text-muted",
  info: "bg-[#e9f2ff] text-info",
  sample: "bg-[#fff1ec] text-accent-ink",
  good: "bg-[#dcfff1] text-good",
  warn: "bg-[#fff7d6] text-warn",
  bad: "bg-[#ffeceb] text-[#ae2e24]",
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
      className={`inline-block shrink-0 rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

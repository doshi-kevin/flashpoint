// Small pill label. Props: children (text), tone ("neutral" | "sample" | "good" | "warn" | "bad").
const tones = {
  neutral: "bg-gray-100 text-gray-700",
  sample: "bg-amber-100 text-amber-800",
  good: "bg-green-100 text-green-800",
  warn: "bg-yellow-100 text-yellow-800",
  bad: "bg-red-100 text-red-800",
};

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

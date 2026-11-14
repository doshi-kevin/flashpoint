// Status pill. Props: children (text), tone (see `tones`).
// Every tone differs by fill, outline or pattern as well as color, so status never relies on color alone.
// "info" = in progress (filled ink). "real" = lime (real people). "synthetic" = grey hatched (AI-predicted).
const tones = {
  neutral: "bg-line text-ink-2",
  info: "bg-ink text-paper",
  sample: "border border-dashed border-line-strong text-ink-2",
  replay: "border border-dashed border-line-strong text-ink-2",
  designed: "border border-ink-2 text-ink-2",
  synthetic: "hatch text-ink",
  real: "bg-lime text-ink ring-1 ring-ink/25",
  good: "bg-moss-soft text-moss",
  warn: "bg-ochre-soft text-ochre",
  bad: "bg-crimson-soft text-crimson",
};

export type BadgeTone = keyof typeof tones;

export default function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

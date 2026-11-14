// The sunlight centerpiece: what public data can't answer, named by the Detective agent, and the one
// question that goes to real people on Flashpoint. Props: unknown, question ({text, options}), rationale, children (the action).
import AgentTag from "./AgentTag";
import FlashpointMark from "./FlashpointMark";
import { copy } from "@/content/copy";

export default function GapCenterpiece({
  unknown,
  question,
  rationale,
  children,
}: {
  unknown: string;
  question: { text: string; options: string[] };
  rationale?: string;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="gap-h" className="amber-card relative overflow-hidden p-6 sm:p-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(217,240,107,0.55) 0%, rgba(253,230,138,0.25) 60%, transparent 100%)" }}
        aria-hidden
      />
      <div className="relative space-y-6">
        <div className="glass inline-flex flex-wrap items-center gap-2 rounded-full px-3 py-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ochre shadow-[0_0_10px_rgba(138,90,11,0.7)]" aria-hidden />
          <span className="font-mono text-xs font-medium uppercase tracking-widest">{copy.canvas.s3.eyebrow}</span>
          <AgentTag agent="Detective" />
        </div>
        <h2 id="gap-h" className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
          {copy.canvas.s3.title}
        </h2>
        <p className="max-w-3xl text-lg font-medium leading-relaxed text-ink/85">{unknown}</p>

        <div className="glass sculpt-alt grid gap-5 p-5 sm:p-6 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label !text-ink-2">{copy.canvas.question}</span>
              <FlashpointMark />
            </div>
            <p className="font-serif text-3xl italic leading-tight">{question.text}</p>
            {rationale && <p className="text-sm text-ink-2">{rationale}</p>}
          </div>
          <div className="rounded-2xl border border-line/80 bg-card/80 p-3">
            <p className="label mb-2">{copy.investigation.preview}</p>
            <ul className="space-y-1.5">
              {question.options.map((o) => (
                <li key={o} className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium">
                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line-strong" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

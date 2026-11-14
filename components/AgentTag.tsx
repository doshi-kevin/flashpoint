// Small labeled tag naming which agent (or plain code) did a step, so the multi-agent story is visible.
// Props: agent ("Code" | "Detective" | "Challenger" | "Flashpoint"). agentFor() guesses it from a trace step.
export type Agent = "Code" | "Detective" | "Challenger" | "Flashpoint";

const styles: Record<Agent, { cls: string; glyph: string }> = {
  Code: { cls: "bg-line text-ink-2", glyph: "◇" },
  Detective: { cls: "bg-ink text-paper", glyph: "●" },
  Challenger: { cls: "bg-crimson-soft text-crimson", glyph: "▲" },
  Flashpoint: { cls: "bg-lime text-ink ring-1 ring-ink/25", glyph: "■" },
};

export function agentFor(step: string, source: string): Agent {
  const s = `${step} ${source}`.toLowerCase();
  if (/challenger|alibi/.test(s)) return "Challenger";
  if (/flashpoint/.test(s)) return "Flashpoint";
  if (/detective|suspect|the gap|one question/.test(s)) return "Detective";
  return "Code";
}

export default function AgentTag({ agent }: { agent: Agent }) {
  const st = styles[agent];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${st.cls}`}
    >
      <span aria-hidden="true">{st.glyph}</span>
      {agent}
    </span>
  );
}

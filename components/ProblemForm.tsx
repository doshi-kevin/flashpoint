"use client";
// The input: a judge describes a problem (or picks an example) and starts the agents.
// Props: value, onChange, live, onLiveChange, running, onRun.
import { copy } from "@/content/copy";

type Props = {
  value: string;
  onChange: (v: string) => void;
  live: boolean;
  onLiveChange: (v: boolean) => void;
  running: boolean;
  onRun: () => void;
};

export default function ProblemForm({ value, onChange, live, onLiveChange, running, onRun }: Props) {
  return (
    <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <label htmlFor="problem" className="font-semibold">
        {copy.form.label}
      </label>
      <textarea
        id="problem"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.form.placeholder}
        rows={2}
        disabled={running}
        className="mt-2 w-full resize-none rounded-lg border border-line bg-bg p-3 text-base outline-none focus:border-accent"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {copy.form.examples.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={running}
            onClick={() => onChange(ex.text)}
            className="rounded-full border border-line bg-soft px-3 py-1 text-xs hover:border-accent disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onRun}
          disabled={running || !value.trim()}
          className="rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
        >
          {running ? copy.form.working : copy.form.button}
        </button>
        <div className="flex overflow-hidden rounded-full border border-line text-xs" role="group" aria-label="Mode">
          {[
            { v: true, label: copy.form.live },
            { v: false, label: copy.form.replay },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              disabled={running}
              onClick={() => onLiveChange(o.v)}
              aria-pressed={live === o.v}
              className={`px-3 py-2 ${live === o.v ? "bg-fg text-white" : "bg-panel text-muted"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

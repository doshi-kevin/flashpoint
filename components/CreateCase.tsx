"use client";
// "Create case" button + dialog. The user describes a problem; we hand it to /case/new via sessionStorage.
// No props.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/content/copy";

export const PROBLEM_KEY = "ep-problem";
export const LIVE_KEY = "ep-live";

export default function CreateCase() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(copy.create.examples[0].text);
  const [live, setLive] = useState(true);

  function submit() {
    if (!text.trim()) return;
    try {
      sessionStorage.setItem(PROBLEM_KEY, text.trim());
      sessionStorage.setItem(LIVE_KEY, live ? "1" : "0");
    } catch {
      /* storage blocked: /case/new falls back to the default example */
    }
    setOpen(false);
    router.push("/case/new");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-full border border-ink/25 bg-lime px-3 py-1.5 text-xs font-bold text-ink hover:bg-lime-deep sm:px-3.5 sm:py-2 sm:text-sm"
      >
        {copy.topbar.create}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-24" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-line-strong bg-panel p-5 shadow-xl">
            <h2 className="text-lg font-semibold">{copy.create.title}</h2>
            <label htmlFor="problem" className="label mt-4 block">
              {copy.create.label}
            </label>
            <textarea
              id="problem"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={copy.create.placeholder}
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-line bg-paper p-2.5 text-sm outline-none focus:border-ink"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {copy.create.examples.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setText(ex.text)}
                  className="rounded-md border border-line bg-soft px-2.5 py-1 text-xs hover:border-ink"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex overflow-hidden rounded border border-line text-xs" role="group" aria-label="Mode">
                {[
                  { v: true, label: copy.create.live },
                  { v: false, label: copy.create.replay },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setLive(o.v)}
                    aria-pressed={live === o.v}
                    className={`px-3 py-1.5 ${live === o.v ? "bg-ink text-paper" : "bg-panel text-muted"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted hover:bg-soft">
                  {copy.create.cancel}
                </button>
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="rounded-md border border-ink/25 bg-lime px-3.5 py-2 text-sm font-bold text-ink hover:bg-lime-deep disabled:opacity-50"
                >
                  {copy.create.submit}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

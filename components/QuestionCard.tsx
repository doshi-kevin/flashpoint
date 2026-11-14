// Proposed survey question, shown as respondents will see it on Flashpoint. Props: text, options (3 strings), rationale.
import FlashpointMark from "./FlashpointMark";
import { copy } from "@/content/copy";

export default function QuestionCard({ text, options, rationale }: { text: string; options: string[]; rationale?: string }) {
  return (
    <div className="rounded-md border-2 border-ink bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <p className="label">{copy.investigation.questionTitle}</p>
        <FlashpointMark />
      </div>
      <div className="grid gap-5 p-4 md:grid-cols-2">
        <div>
          <p className="text-xl font-extrabold leading-snug">{text}</p>
          {rationale && <p className="mt-3 text-sm text-ink-2">{rationale}</p>}
        </div>
        <div className="rounded-md border border-line bg-paper p-3">
          <p className="label mb-2">{copy.investigation.preview}</p>
          <ul className="space-y-1.5">
            {options.map((o) => (
              <li key={o} className="flex items-center gap-2.5 rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium">
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line-strong" aria-hidden />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Proposed survey question, shown as respondents will see it on Flashpoint. Props: text, options (3 strings), rationale.
import { copy } from "@/content/copy";

export default function QuestionCard({ text, options, rationale }: { text: string; options: string[]; rationale?: string }) {
  return (
    <div className="rounded border border-line bg-panel">
      <p className="label border-b border-line px-4 py-2">{copy.investigation.questionTitle}</p>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-base font-semibold">{text}</p>
          {rationale && <p className="mt-2 text-sm text-muted">{rationale}</p>}
        </div>
        <div className="rounded border border-line bg-bg p-3">
          <p className="label mb-2">{copy.investigation.preview}</p>
          <ul className="space-y-1.5">
            {options.map((o) => (
              <li key={o} className="flex items-center gap-2 rounded border border-line bg-panel px-2 py-1.5 text-sm">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-line" aria-hidden />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

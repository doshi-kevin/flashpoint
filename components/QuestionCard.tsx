// The one question, shown as a respondent would see it on Flashpoint. Props: text, options (3 strings).
import { copy } from "@/content/copy";

export default function QuestionCard({ text, options }: { text: string; options: string[] }) {
  return (
    <div>
      <p className="eyebrow">{copy.findings.preview}</p>
      <div className="mt-2 max-w-md rounded-2xl border border-line bg-soft p-5">
        <p className="font-serif text-xl leading-snug">{text}</p>
        <ul className="mt-4 space-y-2">
          {options.map((o) => (
            <li key={o} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-sm">
              <span className="h-4 w-4 rounded-full border-2 border-line" aria-hidden />
              {o}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

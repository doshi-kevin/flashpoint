// Highlighted "open question" panel: what public data can't answer. Props: text.
import { copy } from "@/content/copy";

export default function UnknownCallout({ text }: { text: string }) {
  return (
    <div className="rounded border border-[#f8a98f] border-l-4 border-l-accent bg-[#fff8f5] p-4">
      <p className="label !text-accent-ink">{copy.investigation.gapTitle}</p>
      <p className="mt-1 text-base">{text}</p>
    </div>
  );
}

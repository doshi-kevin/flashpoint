// The highlighted "The internet doesn't know" moment. Props: text (what public data can't answer).
import { copy } from "@/content/copy";

export default function UnknownCallout({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-accent/60 bg-accent/10 p-4">
      <h3 className="mb-1 font-serif text-xl font-semibold text-accent">{copy.why.unknownTitle}</h3>
      <p className="text-cream/90">{text}</p>
    </div>
  );
}

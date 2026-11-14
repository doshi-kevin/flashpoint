// The turning point of the story: what public data can't answer. Visually the strongest block on the page.
// Props: text.
import { copy } from "@/content/copy";

export default function UnknownCallout({ text }: { text: string }) {
  return (
    <section aria-labelledby="gap-h" className="rounded-md bg-ink p-6 text-paper sm:p-8">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-lime">? · gap in the evidence</p>
      <h2 id="gap-h" className="mb-3 text-2xl font-extrabold sm:text-3xl">
        {copy.investigation.gapTitle}
      </h2>
      <p className="max-w-2xl text-lg leading-relaxed text-paper/90">{text}</p>
    </section>
  );
}

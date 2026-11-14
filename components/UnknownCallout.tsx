// The highlighted "The internet doesn't know" moment. Props: text (what public data can't answer).
export default function UnknownCallout({ text }: { text: string }) {
  return (
    <div className="rounded-xl border-2 border-accent bg-accent/10 p-5">
      <p className="eyebrow !text-accent-ink">The internet doesn't know</p>
      <p className="mt-1 font-serif text-xl leading-snug">{text}</p>
    </div>
  );
}

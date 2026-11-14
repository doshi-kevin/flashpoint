// The highlighted "The internet doesn't know" moment. Props: text (what public data can't answer).
import { copy } from "@/content/copy";

export default function UnknownCallout({ text }: { text: string }) {
  return (
    <div className="rounded border-2 border-purple-500 bg-purple-50 p-4">
      <h3 className="mb-1 text-lg font-bold">{copy.investigate.unknownTitle}</h3>
      <p>{text}</p>
    </div>
  );
}

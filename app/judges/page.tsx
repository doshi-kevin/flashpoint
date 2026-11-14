// Screen 5: Closing slide. QR to NEXT_PUBLIC_JUDGE_SURVEY_URL + synthetic vs real judge answers from /data/judges.json.
import QrBlock from "@/components/QrBlock";
import ResultColumn from "@/components/ResultColumn";
import SampleBadge from "@/components/SampleBadge";
import { getJudges } from "@/lib/data";
import { topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";

export default function JudgesPage() {
  const j = getJudges();
  const url = process.env.NEXT_PUBLIC_JUDGE_SURVEY_URL || "https://example.com/judge-survey";
  return (
    <div className="space-y-8 text-center">
      <div className="flex items-center justify-center gap-2">
        <h1 className="font-serif text-4xl font-semibold">{copy.judges.title}</h1>
        <SampleBadge kind="replay" />
      </div>
      <p className="font-serif text-xl text-muted">{j.question}</p>
      <QrBlock url={url} />
      <div className="grid gap-4 text-left md:grid-cols-2">
        <ResultColumn
          title={copy.judges.synthetic}
          options={j.options}
          values={j.synthetic}
          highlightIndex={j.options.indexOf(topOption(j, "synthetic"))}
        />
        <ResultColumn
          title={copy.judges.real}
          options={j.options}
          values={j.real}
          highlightIndex={j.options.indexOf(topOption(j, "real"))}
        />
      </div>
    </div>
  );
}

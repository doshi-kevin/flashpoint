// Live survey page: QR to NEXT_PUBLIC_JUDGE_SURVEY_URL + synthetic judges vs "You said" from /data/judges.json.
import QrBlock from "@/components/QrBlock";
import ResultColumn from "@/components/ResultColumn";
import SampleBadge from "@/components/SampleBadge";
import { getJudges } from "@/lib/data";
import { topOption } from "@/lib/metrics";
import { copy } from "@/content/copy";

export default function SurveyPage() {
  const j = getJudges();
  const url = process.env.NEXT_PUBLIC_JUDGE_SURVEY_URL || "https://example.com/judge-survey";
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{copy.survey.title}</h1>
          <p className="max-w-xl text-ink-2">{copy.survey.sub}</p>
        </div>
        <SampleBadge kind="replay" />
      </div>
      <p className="max-w-3xl font-serif text-3xl italic leading-snug">{j.question}</p>
      <div className="grid items-start gap-4 lg:grid-cols-[auto_1fr_1fr]">
        <div className="sculpt p-6">
          <QrBlock url={url} size={200} />
        </div>
        <ResultColumn
          title={copy.survey.synthetic}
          options={j.options}
          values={j.synthetic}
          highlightIndex={j.options.indexOf(topOption(j, "synthetic"))}
          variant="synthetic"
        />
        <ResultColumn
          title={copy.survey.real}
          options={j.options}
          values={j.real}
          highlightIndex={j.options.indexOf(topOption(j, "real"))}
          variant="real"
          badge="replay"
        />
      </div>
    </div>
  );
}

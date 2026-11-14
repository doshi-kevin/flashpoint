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
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{copy.survey.title}</h1>
          <p className="text-sm text-muted">{copy.survey.sub}</p>
        </div>
        <SampleBadge kind="replay" />
      </div>
      <p className="text-base font-semibold">{j.question}</p>
      <div className="grid gap-4 md:grid-cols-[auto_1fr_1fr]">
        <div className="rounded border border-line bg-panel p-5">
          <QrBlock url={url} size={200} />
        </div>
        <ResultColumn
          title={copy.survey.synthetic}
          options={j.options}
          values={j.synthetic}
          highlightIndex={j.options.indexOf(topOption(j, "synthetic"))}
        />
        <ResultColumn
          title={copy.survey.real}
          options={j.options}
          values={j.real}
          highlightIndex={j.options.indexOf(topOption(j, "real"))}
        />
      </div>
    </div>
  );
}

// Judge feedback page: a QR to a short Flashpoint survey that asks judges about this presentation (for future prospects).
// URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import QrBlock from "@/components/QrBlock";
import FlashpointMark from "@/components/FlashpointMark";

const URL_ = process.env.NEXT_PUBLIC_JUDGE_SURVEY_URL || "https://flashpointopinions.com";

export default function JudgesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="label">Judge feedback</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">What did you think?</h1>
        <p className="max-w-2xl text-lg font-semibold text-ink-2">Three quick questions. Your answers tell us what to build for our first customers.</p>
      </div>
      <div className="amber-card grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        <div className="truth-card flex justify-center p-5">
          <QrBlock url={URL_} size={240} />
        </div>
        <div className="space-y-4">
          <ul className="space-y-2 text-2xl font-black leading-tight">
            <li>1. Would you use this?</li>
            <li>2. What convinced you most?</li>
            <li>3. What would make you a customer?</li>
          </ul>
          <FlashpointMark label="Survey run on Flashpoint" />
        </div>
      </div>
    </div>
  );
}

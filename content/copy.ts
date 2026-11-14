// All user-facing text lives here so it can be edited in one place.
export const copy = {
  appName: "Economic Pulse",
  tagline: "Claude knows what it doesn't know. Flashpoint goes and asks.",
  nav: { judges: "Judges" },
  badges: { sample: "Sample data", replay: "Replay" },
  liveToggle: "Live Claude",
  steps: ["Drop", "Why", "Ask", "Decide"],
  eyebrows: ["01 / 04 · The drop", "02 / 04 · The investigation", "03 / 04 · Ask real people", "04 / 04 · The decision"],
  drop: {
    label: "Weekday lunch sales, last 3 weeks vs prior 6",
    button: "Investigate →",
  },
  agent: {
    title: "Agent at work",
    thinking: "Thinking…",
  },
  why: {
    title: "What public data suggests",
    unknownTitle: "The internet doesn't know",
    questionTitle: "So we ask real people, one question",
    button: "Ask real people on Flashpoint →",
  },
  fielding: {
    title: "Flashpoint is asking real people",
    phases: ["Publishing the survey on Flashpoint", "Synthetic customers predicting", "Real respondents answering"],
    responses: "responses",
  },
  ask: {
    predicted: "AI predicted",
    real: "Real people said",
    headline: (predicted: string, real: string) => `AI predicted “${predicted}”. Real people said “${real}”.`,
    miss: (option: string, gap: number) => `Biggest miss: “${option}” (${gap} pts off)`,
    respondents: "respondents",
    button: "See the decision →",
  },
  decide: {
    title: "Don't discount. Fix the line.",
    before: "Before",
    after: "After",
    owner: "Owner",
    review: "Review",
    restart: "Start over",
  },
  judges: {
    title: "Now it's your turn",
    scan: "Scan to answer",
    synthetic: "Our synthetic judges predicted…",
    real: "You said…",
  },
  notFound: "Not found",
};

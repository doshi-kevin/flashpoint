// All user-facing text lives here so it can be edited in one place.
export const copy = {
  appName: "Economic Pulse",
  tagline: "Claude knows what it doesn't know. Flashpoint goes and asks.",
  nav: { judges: "Judges" },
  badges: { sample: "Sample data", replay: "Replay" },
  liveToggle: "Live Claude",
  steps: ["Drop", "Why", "Ask", "Decide"],
  drop: {
    label: "Weekday lunch sales, last 3 weeks",
    button: "Find out why →",
  },
  why: {
    title: "What public data suggests",
    unknownTitle: "The internet doesn't know",
    questionTitle: "So we ask real people, one question",
    button: "Ask real people →",
    running: "Investigating…",
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
    title: "The decision",
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

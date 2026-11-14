# Merged plan: Economic Pulse x Casefile

Both `adi.md` (Economic Pulse) and `janvi.md` (Casefile) tell the same story. This file is the one version we build.

> **Data tells you what. People tell you why.** Claude knows what it doesn't know. Flashpoint goes and asks.

## What is the same in both ideas
1. A number drops (store sales, foot traffic). Dashboards show *what*, not *why*.
2. An AI agent investigates public and internal data and names **suspects**, each with evidence for and against.
3. The agent **admits what data can't answer** ("The internet doesn't know").
4. Flashpoint asks **real people** (staff, lapsed customers, residents), not synthetic ones.
5. The answer **flips the recommendation** (before vs after), with an owner and a review date.
6. Honest labels: every claim has a source, uncertainty is words not fake percentages, demo data is labelled.

## The mix (what we build)
- **Product name and demo world:** **Economic Pulse**, store level (fictional sandwich chain, Store 14). It is what the code already does and it is simple to demo.
- **Casefile's best parts, kept:** the detective framing ("open the case, collect clues, name suspects, check alibis, question witnesses, close the case"), a **Challenger** agent that tries to clear suspects, and a **temporary vs structural** verdict.
- **Economic Pulse's best parts, kept:** code computes every number, the evidence ladder (store data, then staff, then customers, then a panel), the synthetic-vs-real contrast, the review-integrity idea, and the coupon base for lapsed customers (designed, not run).
- **Judges as witnesses:** QR on the closing slide; their answers are the live "real people said" column.
- **Stretch (only if time):** the "why" map (taps on a photo cluster on one spot).
- **Dropped:** commercial real estate as the main story (Casefile) and investment alpha. Casefile can be one sentence in the pitch ("same engine works for a shopping street").

## The loop (what the app does)
**Spot -> Investigate -> Challenge -> Admit the unknown -> Ask real people -> Verdict and decision -> Measure.**

| Step | Screen | Who builds it |
|---|---|---|
| Spot: Store 14 flagged, -12% | `/` Portfolio | code (Kevin) |
| Investigate: suspects with for/against, status words | `/investigate/[id]` | Claude agent (Kevin) |
| Challenge: Challenger clears or downgrades suspects | `/investigate/[id]` | second Claude call (Kevin) |
| Admit: "The internet doesn't know" + the ONE question | `/investigate/[id]` | Claude agent (Kevin) |
| Ask: Flashpoint study, synthetic prediction vs real answers, gap | `/study/[id]` | Flashpoint data (Adi) |
| Verdict: temporary or structural, plus before/after card | `/decision/[id]` | logic (Kevin), numbers (Adi) |
| Witnesses: judges scan QR, answers shown | `/judges` | Flashpoint (Adi) |

## Demo story (one version)
Store 14's weekday lunch sales are down 12%. Public data points to roadworks, a rival's $5 deal, and rain. The agent says what it can't know: *why lapsed regulars actually left*. Flashpoint asks one question. The synthetic customers predicted "$1 off"; real people said "faster line". Verdict: **temporary, fixable at the store**, not a dying neighborhood. Recommendation flips from "run a $1-off promo" to "add a second register at lunch". Owner, success metric, review date.

## Rules (from both docs)
- Code computes numbers; the LLM never does.
- Never claim a cause: "the evidence points to".
- Synthetic personas are a contrast, never evidence.
- Labels on screen: SYNTHETIC (store data, personas), REAL (Flashpoint answers), CACHED/REPLAY (saved results), DESIGNED (coupon loop).
- Same reward for every respondent whatever they say; never ask for stars.

## Who does what
- **Kevin:** `WORK_KEVIN.md` (agent, Challenger, verdict, numbers)
- **Adi:** `WORK_ADI.md` (Flashpoint, real data, demo world, story prep)
- **Janvi:** UI/UX and presentation, see `TEAM_SPLIT.md`

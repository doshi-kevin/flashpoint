# Adi: Flashpoint, data and story ("the evidence")

Read `MERGED_PLAN.md` first. You own what real people say and the demo world. Don't edit `components/`, `content/copy.ts`, `lib/investigate.ts`, `lib/metrics.ts` or `lib/types.ts` (Janvi / Kevin own those).

**Your files:** `data/**`, `lib/flashpoint.ts`, `adi.md`, your Flashpoint surveys.

## Tasks in order

1. **Publish the Flashpoint surveys now** (Survey A "Silent quit", Survey B "Store 14 staff check") and send Survey A to every group chat. Resend at 1 hour. A third mini-survey is the **one question** the app asks: *"What would bring you back to Store 14 for lunch?"* with options *Extra cheese / $1 off / Faster line* (or tell Kevin if the question changes).
2. **Real results into the app:** edit `data/study-results.json` (`synthetic` and `real` are percentages per option, `sampleSize` is the real n). Keep the same keys and shape.
3. **Synthetic prediction:** run the same question on Flashpoint's AI personas and put the percentages in `synthetic`. Label it as synthetic, never as evidence.
4. **Judges' column:** collect the judges' live answers and put them in `data/judges.json`. Update `NEXT_PUBLIC_JUDGE_SURVEY_URL` in `.env` to the real `flashpoint.ai/s/{survey_id}` link.
5. **Demo world** (`data/`): make `stores.json`, `sales.json`, `events.json`, `signals.json` match the story (roadworks, rival $5 deal, two rain days, no local spending pullback). Add `data/traffic.json` (visits and average ticket per day, same dates as `sales.json`) for Kevin's visits-vs-spend metric.
6. **Live adapter** (`lib/flashpoint.ts`): only if a server token works. Ask Flashpoint how a server gets a Bearer token; if not, keep `FLASHPOINT_MODE=mock` and replay saved results (badge stays "Replay").
7. **Panel quote:** get a ZIP panel quote from Flashpoint for the "price of certainty" and save it as `data/quote.json` (`{ price, eta, n }`).
8. **Stretch:** `data/hotspots.json` with tap coordinates for the "why" map.
9. **Pitch support:** judge Q&A, the label policy (SYNTHETIC / REAL / CACHED / DESIGNED), and check every number on screen against the source before the demo.

## Contract with the others
- Change **values**, not **keys**. If a shape must change, ask Kevin (he owns `lib/types.ts`).
- Your numbers appear on Janvi's screens with no code change. Run `npm run dev` and look at `/study/14` and `/judges` after each edit.
- Validate JSON before pushing (`node -e "require('./data/study-results.json')"`).

## Done when
- `/study/14` and `/judges` show real Flashpoint numbers with the right badges.
- Every data file is valid JSON and matches the story.
- Work lives on branch `adi`; `git pull --rebase origin main` before each push.

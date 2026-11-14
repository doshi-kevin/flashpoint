# Team split: who owns which files

Start with `MERGED_PLAN.md` (the one combined idea). Detailed task lists: `WORK_KEVIN.md` and `WORK_ADI.md`. `.env` is committed on purpose (team decision); `.env.local` is ignored.

Goal: three people, one repo, no merge conflicts. **Edit only files you own.** Need a change in someone else's file? Message them (or open a tiny PR to them).

| Person | Role | Owns |
|---|---|---|
| **Janvi** | UI/UX, look and feel, presentation | `components/**`, `app/layout.tsx`, `app/globals.css`, `app/**/page.tsx`, `content/copy.ts`, `public/**`, slides and pitch script |
| **Kevin** | Agent and backend: the "brain" | `lib/investigate.ts`, `lib/metrics.ts`, `lib/types.ts`, `app/api/**`, `.env.example` |
| **Aditya (Adi)** | Flashpoint and data/story: the "evidence" | `lib/flashpoint.ts`, `data/**`, `adi.md`, Flashpoint surveys A and B, real results, fallbacks, Q&A prep |

Shared, touch rarely and tell the others: `package.json` (add dependencies only after asking the group), `README.md`.

## Janvi: UI/UX and presentation
- Restyle every screen: Portfolio, Investigate, Study, Decision, Judges.
- Components are one per file with a props comment at the top. Change Tailwind classes and layout freely.
- Edit all wording in `content/copy.ts`.
- Add accessibility (status never by color alone, keyboard, mobile) and the "Sample data / Replay / Real / Live" labels look.
- Build the slides, the 4-minute pitch and the backup video.
- Stay out of `lib/`, `app/api/`, `data/`. In `InvestigationWorkspace.tsx` and `StudyView.tsx`, restyle only; leave the `fetch` and state code alone (Kevin will tell you if its output changes).

## Kevin: agent and backend
- Make `/api/agent` excellent: prompt, strict JSON, parsing, fallback (`lib/investigate.ts`).
- Anomaly logic and all numbers in code: baseline, visits vs spend, comparison stores, gap math (`lib/metrics.ts`).
- Add the "the internet doesn't know" logic and the question designer: when to ask, one neutral question, 3 options.
- Own the response shapes in `lib/types.ts`. **These are the contract**: if a shape changes, tell Janvi and Adi first.
- Agent trace and sources per claim (if wanted for the demo): add fields to the API response, not to the UI.
- Test with a real `ANTHROPIC_API_KEY` in `.env.local`.

## Adi: Flashpoint and data/story
- Build and publish Flashpoint Survey A (silent quit) and Survey B (staff check). Send Survey A everywhere now.
- Put real answers into the app by editing `data/study-results.json` and `data/judges.json` (same shape, keep it valid).
- Implement the live adapter in `lib/flashpoint.ts` (`FlashpointAdapter`, `FLASHPOINT_MODE=live`) only if a server token works; otherwise keep `mock` plus saved replays.
- Own the demo world in `data/`: stores, sales, events, signals, decisions. Keep the planted tells consistent with the story.
- Synthetic personas results and panel quote (for the contrast and "price of certainty").
- Judge Q&A, label policy (SYNTHETIC / REAL / LIVE / CACHED / DESIGNED), and checking every number before the pitch.

## Rules that prevent conflicts
1. **Work on your own branch** (`janvi`, `kevin`, `adi`). Merge to `main` in small commits; `git pull --rebase origin main` before every push.
2. **Data shapes are frozen** in `lib/types.ts` and the `data/*.json` files. Adi may change values, not keys; Kevin may add optional fields and will announce them.
3. **No new dependencies** without asking the group (QR, Recharts, Anthropic SDK are already in).
4. **All text in `content/copy.ts`**, all numbers computed in `lib/metrics.ts`, never typed into components or the LLM.
5. `.env` is committed on purpose (team decision). Use `.env.local` for personal overrides; it is ignored.

## Handoffs
- Adi's real numbers -> `data/*.json` -> Janvi's screens update with no code change.
- Kevin's API output -> `lib/types.ts` -> Janvi renders it.

## Heads-up: two directions in the repo
`janvi.md` describes **Casefile** (commercial real estate, "temporary vs structural" verdict); `adi.md` and the current code are **Unknown** (store sales). The scaffold follows Unknown. Decide as a team before building more, because Casefile would change the data, the copy and the agent prompt.

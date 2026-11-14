# Unknown

When a store's sales drop, an AI agent investigates, admits what public data can't explain, and designs a one-question study to ask real people (via Flashpoint.AI).

> Claude knows what it doesn't know. Flashpoint goes and asks.

Stack: Next.js (App Router) + TypeScript + Tailwind, Recharts, `@anthropic-ai/sdk` (server-side only), `qrcode.react`. No database; mock JSON in `/data`.

## Setup

```bash
npm install
# .env is committed; put ANTHROPIC_API_KEY in it (or in .env.local to override)
npm run dev                  # http://localhost:3000
```

Without an API key the app still works: `/api/agent` falls back to `data/fallback-investigation.json` and shows a "Replay" badge.

## Env vars

| Var | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Claude access (server only) |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Model for the investigation |
| `FLASHPOINT_MODE` | `mock` | `mock` reads `data/study-results.json`; `live` is a stub (see `lib/flashpoint.ts`) |
| `NEXT_PUBLIC_JUDGE_SURVEY_URL` | placeholder | URL encoded in the QR on `/judges` |

`.env` is committed on purpose (team decision); `.env.local` is git-ignored.

## Screens

1. `/` Cases list (Jira-style): auto-detected cases (anomaly rule) and a store-health table. "Create case" in the top bar lets anyone describe a problem.
2. `/case/[id]` (e.g. `/case/14`) and `/case/new`: one case with a workflow status (Open → Investigating → Investigated → In field → Study complete → Decision ready → Approved), tabs (Overview, Investigation, Flashpoint study, Decision) and a Details panel. Live Claude agents (Detective + Challenger) stream their steps; "Replay" mode skips Claude.
3. `/judges` Live survey: QR + synthetic judges vs "You said".

## File map

- `app/` routes (one per screen) and `app/api/*` (`investigate`, `study/[storeId]`)
- `components/` one component per file, each with a purpose/props comment at the top
- `content/copy.ts` all user-facing text
- `lib/metrics.ts` every number (sales change, gaps) computed here, never by the LLM
- `lib/investigate.ts` Claude call, fence stripping, safe parse, fallback
- `lib/flashpoint.ts` `FlashpointAdapter` (mock / live)
- `lib/data.ts`, `lib/types.ts` data loaders and types
- `data/*.json` all mock data (stores, sales, events, signals, study results, decisions, judges, fallback)

## For Janvi (UI/UX)

Edit freely, no logic changes needed:

- `components/*.tsx` (Tailwind classes; `Workspace.tsx` holds the stream/fetch code and state, keep those)
- `app/layout.tsx`, `app/globals.css` global look and nav
- `app/*/page.tsx` page layout (grid/spacing)
- `content/copy.ts` wording

Leave `lib/`, `app/api/`, and `data/` alone.

## Notes

- Mock/replayed views carry a "Sample data" or "Replay" badge (`components/SampleBadge.tsx`).
- This Next.js version enables Cache Components; dynamic `[storeId]` pages set `export const instant = false`.

## Integration handoff (Aditya)

- **Flashpoint (real study):** `lib/flashpoint.ts` (`FlashpointAdapter`, `FLASHPOINT_MODE=live`). The Study tab calls `GET /api/study/[storeId]`; return real `synthetic` and `real` percentages and it renders with no UI change. The fielding animation is a replay (`components/FieldingPanel.tsx`); swap it for real progress when live.
- **Agents:** `lib/investigate.ts` (prompts, Detective + Challenger) streamed by `app/api/agent/route.ts`. Needs `ANTHROPIC_API_KEY` in `.env.local`.
- **Data:** `data/*.json` (sales, events, signals, study results, decisions, judges).
- **UI state:** `components/CaseView.tsx` (stream/fetch + workflow stages). Don't move the fetch calls.

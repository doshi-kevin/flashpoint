# Economic Pulse

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

1. `/` One page. A judge types a business problem (or picks an example). Live Claude agents (Detective + Challenger) investigate, streaming each step; the page shows suspects, "the internet doesn't know", and the one question to ask. "Send to real people on Flashpoint" shows the study (replay of saved results for Store 14) and the decision. "Instant replay" mode skips Claude.
2. `/judges` Closing slide: QR + synthetic judges vs "You said".

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

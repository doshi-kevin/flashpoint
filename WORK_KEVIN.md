# Kevin: agent and backend ("the brain")

Read `MERGED_PLAN.md` first. You own the logic. Don't edit `components/`, `content/copy.ts`, `data/*.json` or `lib/flashpoint.ts` (Janvi / Adi own those).

**Your files:** `lib/investigate.ts`, `lib/metrics.ts`, `lib/types.ts`, `lib/data.ts` (loaders only), `app/api/**`, `.env`.

## Tasks in order

1. **Put the key in `.env`** (`ANTHROPIC_API_KEY=`) and confirm the real call works: open `/investigate/14`, click Investigate, and check the response says `"source": "claude"` (not `"fallback"`).
2. **Better investigation prompt** (`lib/investigate.ts`): use the detective framing, 3-4 suspects, status words only, never numbers. Keep strict JSON, fence stripping and the fallback.
3. **Challenger agent:** a second Claude call that receives the suspects and tries to clear or downgrade them, returning `{ suspect, challenge, newStatus }[]`. Merge into the response; fall back to the saved version on any error.
4. **Verdict** (`temporary | structural | unclear`, plus one sentence of why). Add it to the investigation output and a second, post-study verdict computed from study results.
5. **Decision logic:** build the before/after recommendation from the study result (the winning real option vs the winning synthetic option). Numbers come from `lib/metrics.ts` only. Add `GET /api/decision/[storeId]` so the decision page no longer reads the static JSON.
6. **Metrics upgrades** (`lib/metrics.ts`): baseline = median of same weekday over prior 6 weeks, "5 of last 7 days below baseline" anomaly rule, visits vs spend split (needs `data/traffic.json` from Adi), comparison stores.
7. **Agent trace:** return `trace: { step, detail, source }[]` in the API response so the UI can show what the agent did and which sources it used.
8. **Stretch:** review-integrity check (burst of short 5-star reviews, free-item mentions) as one more suspect.

## Contract with the others
- `lib/types.ts` is the contract. **Only add optional fields**, then message Janvi and Adi with the new shape. Never rename or remove a key.
- New fields you plan: `Investigation.challenges?`, `Investigation.verdict?`, `Investigation.trace?`, `Decision` stays the same.
- Janvi renders what you return; she never calls Claude.
- Adi supplies `data/*.json`; if you need a new data file, add it to his list in `WORK_ADI.md` and ask.

## Done when
- Real Claude call returns valid shape in under ~15 s, and bad output or no key still shows the replay.
- `npm run build` passes; every number on screen traces to `lib/metrics.ts`.
- Work lives on branch `kevin`; `git pull --rebase origin main` before each push.

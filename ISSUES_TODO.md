# Issues to file (no GitHub token or `gh` on this machine, so these are drafts)

## 1. Run the synthetic panel on the Store 14 survey and read results
Survey `8687611b-958a-4d90-a320-5d58a865a608` (draft, Q1 with Extra cheese / $1 off / Faster line) exists in Flashpoint. Run `panel(action="create_and_run")`, poll `status`, and save the distribution to `data/study-results.json` as `synthetic`.

## 2. Get a REST-valid token or read results over MCP
`FLASHPOINT_TOKEN` (REST) returns 401 while the MCP OAuth token works. Either get a REST JWT from Flashpoint or add an MCP client path to `lib/flashpoint.ts`. Keep Replay as the fallback.

## 3. Real respondents: pay with the x402 wallet (needs explicit spend approval)
Wallet has 10 USDC on Base. `tool_survey` returns an `x402_payment_required` envelope, then `payment_confirmation(intent_id)`. Do not run without a stated spend cap.

## 4. Issue #1 leftovers
Structured outputs, effort tuning, abort on client disconnect, `dropStart` and daypart/channel facts, anomaly baseline end, lint errors in `CaseView.tsx` and `app/case/new/page.tsx`.

## 5. Store 36 scenario is gated as "within normal range"
Decide whether the Eastfield economy case should bypass the anomaly gate and get its own saved replay.

## 6. Replace mock news/precedents and ad tap counts
`components/PrecedentsPanel.tsx` and `components/AdCard.tsx` use sample data. Label stays "Sample" until a real source exists.

## 7. Rotate the wallet key
The private key was pasted into a chat. Move funds and use a fresh key after the hackathon.

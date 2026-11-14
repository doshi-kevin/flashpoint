# data/: the demo world and the evidence (owner: Adi)

Everything here is read by `lib/data.ts` and `lib/flashpoint.ts`. **Change values, not keys**: shapes are frozen in `lib/types.ts` (Kevin).

```bash
node data/generate.mjs          # regenerate every generated file (fixed seed: identical output every run)
node --test data/data.test.mjs  # 20 checks: shapes, reproducibility, realism benchmarks, every story tell
```

## The world (all SYNTHETIC, fictional)

**Crumb & Crust**: a 40-unit quick-service burger franchise group in one fictional metro, 5 districts of 8 stores (North Shore, Harbor, Central, Westgate, Eastfield). It's modelled on public US McDonald's-style benchmarks, but every store, number and place is invented. 13 weeks of POS data: **Mon 17 Aug to Fri 13 Nov 2026** (data through yesterday).

| Format | Stores | Target AUV | Avg check | Channel mix (transactions) |
| --- | --- | --- | --- | --- |
| Freestanding with drive-thru | 28 | $4.1M | $11.40 | 66% drive-thru, 18% counter, 8% mobile, 8% delivery |
| Urban in-line (no drive-thru) | 8 | $2.7M | $10.20 | 60% counter, 20% mobile, 20% delivery |
| Campus-adjacent in-line | 1 (Store 12) | $2.3M | $9.40 | 62% counter, 24% mobile, 14% delivery |
| Highway travel plaza | 2 | $4.9M | $12.10 | 48% drive-thru, 40% counter |
| In-store (supercenter) | 1 | $1.5M | $9.20 | 84% counter |

Resulting chain averages (checked by the tests): average check **$11.39**; sales by daypart breakfast 19%, lunch 33%, afternoon 12%, dinner 25%, late night 11%; drive-thru 53% of chain sales (60-78% at drive-thru stores), delivery 15% of sales (delivery orders are bigger).

**What makes it behave like real POS data**
- Daily transactions are Poisson-distributed, with a daily store shock (±3%), a weekly store shock that persists (AR(1)) and a gentle per-store trend.
- Each format has its own weekly rhythm: drive-thrus peak Friday and Saturday, office stores are quiet at weekends, the travel plaza is busiest at weekends, campus is quiet on Saturdays.
- Daypart and channel mix shift through the day: breakfast leans drive-thru; dinner and late night lean delivery.
- Delivery tickets are about 1.6x a drive-thru ticket (bigger orders plus menu markup).
- City-wide calendar in `calendar.json`: University term starts 31 Aug, Labor Day, schools start 8 Sep, a 4-week national promotion (21 Sep to 18 Oct), a menu price rise (+2.2% check from 5 Oct), Indigenous Peoples' Day, Halloween on a Saturday, the end of daylight saving (1 Nov), Veterans Day, paydays (1st and 15th) and the end-of-month squeeze.
- Weather in `weather.json`: daily highs falling from the mid-80s to the 50s °F, with light showers on about 1 day in 5. Rain cuts walk-in visits, lifts delivery and slows the drive-thru.
- Drive-thru service time (`avg_dt_service_sec`) is about 5 minutes at lunch, the core speed-of-service metric for drive-thrus.
- Two real-world data issues are documented in `data-quality.json`.

## Files

| File | Label | What it is |
| --- | --- | --- |
| `pos/daily_daypart_channel.csv` | SYNTHETIC | POS fact table, 66,750 rows: `date, store_id, daypart, channel, transactions, net_sales, avg_dt_service_sec` |
| `sales.json` | SYNTHETIC | Weekday lunch sales per store (65 weekdays). Exactly the lunch sum of the CSV |
| `traffic.json` | SYNTHETIC | Same dates: `visits` (lunch transactions) and `avgTicket` (= sales / visits) |
| `stores.json` | SYNTHETIC | 40 stores (`id, name, chain, area`); 11, 12, 14, 17 and 21 keep their original areas |
| `store-profiles.json` | SYNTHETIC | District, format, drive-thru, hours, seats, **pre-registered comparison stores** |
| `calendar.json` | CACHED | Holidays, promotions, price change, local shocks, with scope (chain, city, district or store) |
| `weather.json` | CACHED | City weather by day, rain intensity by morning, midday and evening |
| `events.json` | CACHED | Chart markers per store (types limited to rain, roadworks and competitor by `lib/types.ts`) |
| `signals.json` | CACHED | Public-signal fixtures for Stores 14, 12 and 36 |
| `data-quality.json` | SYNTHETIC | Known POS issues to exclude from baselines |
| `study-results.json`, `judges.json` | REAL (once filled) | Flashpoint answers. **Current values are placeholders, not real answers** |
| `decisions.json` | DESIGNED | Owner, success metric and review date (Kevin computes the before/after text) |
| `fallback-investigation.json` | CACHED | Replay of the agent output when Claude is unavailable |

Dayparts: breakfast 05:00-10:30, lunch 10:30-14:00, afternoon 14:00-17:00, dinner 17:00-20:00, late night 20:00 to close. Channels: `drive_thru`, `counter` (front counter and kiosk), `mobile_pickup` (app order collected in store), `delivery` (third-party).

## The story the numbers tell (every tell is a test)

**Store 14, Harbor Street** (freestanding drive-thru, Harbor district): weekday lunch **-19%** (last 3 weeks vs the 6 before, as `lib/metrics.ts` computes it). Kevin's anomaly rule fires for Store 14 and **no other store**.

| Suspect | What the data shows | Verdict the data supports |
| --- | --- | --- |
| Harbor St roadworks (one lane closed 10:00-15:00 from 26 Oct) | The change point is exactly 26 Oct. The drop is concentrated at lunch: breakfast and dinner barely move, and the afternoon is in between. At lunch, drive-thru and walk-in fall while delivery holds. Lunch drive-thru service time jumps from about 305 s to about 454 s. | Fits timing, daypart and channel |
| Rival $5 lunch deal (Dock Rd, 2 Nov) | A small real effect (about -3% at walk-in and mobile, Stores 14 and 15), but it starts a week after the drop began | Can't be the start |
| Rain (3 and 10 Nov, city-wide) | Every store's walk-in dips and delivery rises on those 2 days only, then they recover | Short-lived and not store-specific |
| Local economy | The Harbor comparison stores (9, 10, 16, 20) are flat, and the Harbor area spending signal is flat | Local to this store |
| Price / spend per visit | Fewer visits; the ticket rises only in line with the chain-wide price increase | Fewer people, not smaller orders |

What public data **can't** say (the reason we ask Flashpoint): why the lost regulars left, and what would bring them back.

**Other planted cases (for realism and for the economy check)**
- **Eastfield district (Stores 33-40): a real local economy signal.** A local employer's layoffs take effect 16 Oct, and all 8 stores soften together (about -5% to -9%), with a slight trade-down in ticket. None crosses a flag on its own: the signal only shows when you look at the district. Signals are on Store 36.
- **Store 12: one bad day is not an anomaly.** A power cut on 5 Nov halves one lunch; the store stays in normal range and the rule does not fire.
- **Store 27: a data-quality trap.** The POS failed on 29 Sep at breakfast, so those rows are 0 although sales happened. It's listed in `data-quality.json`.
- **Chain-wide moves that comparison stores cancel out:** the promotion, the price rise, the end of daylight saving and seasonality. The typical store is about -1% to -5% over the window.

## Benchmarks and assumptions

| Number | Value used | Basis |
| --- | --- | --- |
| Average sales per US McDonald's restaurant | about $4.09M (2025, 13,706 units) | [QSR Magazine 2025 ranking](https://www.qsrmagazine.com/story/these-20-fast-food-chains-earn-the-most-per-restaurant/) |
| 2024 average unit volume | about $4.0M | [QSR Magazine](https://www.qsrmagazine.com/story/mcdonalds-made-a-big-growth-push-in-2024/) |
| US growth driven mainly by average check | price rise in the data lifts the check, not visits | [McDonald's Q3 2025 results](https://quantisnow.com/insight/mcdonalds-reports-third-quarter-2025-results-6260839), [Advan on Q4 2025](https://advanresearch.com/insights/mcdonalds-q4-consumer-trade-in-more-than-offsets-consumer-trade-out) |
| Quick-service strength at breakfast; daypart mix varies by chain | breakfast 19% of sales | [NRN](https://www.nrn.com/restaurant-operations/new-day-for-breakfast), [QSR Magazine](https://www.qsrmagazine.com/operations/fast-food/wendys-now-no-3-breakfast-player-among-burger-chains/) |
| Average check about $11; channel mix; delivery ticket about 1.6x; drive-thru about 5 min at lunch; rain effects; weekly rhythm | as above | **Assumptions.** McDonald's doesn't publish a US average check, channel shares or daypart split, and I didn't find them in public sources. They're set to plausible industry values and should be described as such on stage |

## Label policy (what the screens must say)

| Label | Use for |
| --- | --- |
| SYNTHETIC | Store data (fictional), Flashpoint AI personas |
| REAL | Human answers collected through Flashpoint |
| LIVE | Read from Flashpoint's API during the demo |
| CACHED | Fixtures: calendar, weather, events, signals, the cached agent answer |
| REPLAY | Saved results shown because live failed or mode is `mock` (the API returns `mode: "mock"`) |
| DESIGNED | Not yet run: the coupon loop, the outcome of the fix |

Personas are a contrast, never evidence. Never claim a cause: "the evidence points to".

## Putting real Flashpoint results in

**Without a token (saved replay):** in Flashpoint's app, read the counts for the question and type the percentages into `study-results.json` `real` (in the same order as `options`) and the number of answers into `sampleSize`. Run the persona panel on the same question and put its percentages in `synthetic`. Do the same for `judges.json`, then run the tests.

**With a token (live):** set these in `.env.local` (git-ignored; **never** in the committed `.env`, because the repo is public):

| Var | Value |
| --- | --- |
| `FLASHPOINT_MODE` | `live` |
| `FLASHPOINT_TOKEN` | Bearer JWT from the Flashpoint team (server only) |
| `FLASHPOINT_STUDY_SURVEY_ID` | Store 14 question survey id |
| `FLASHPOINT_STUDY_QUESTION` | Question label, default `Q1` |
| `FLASHPOINT_JUDGE_SURVEY_ID` / `FLASHPOINT_JUDGE_QUESTION` | Judges' survey id and label |

The adapter reads `GET /api/v1/surveys/{id}/analytics/frequencies/{label}`. It matches each answer `value` to our option text, so the options in Flashpoint must be spelled exactly `Extra cheese`, `$1 off`, `Faster line`. It computes the percentages in code and retries 429 and 5xx errors up to 5 attempts. Any failure falls back to this folder and shows **Replay**. `synthetic` always comes from the file, because personas aren't in Flashpoint's REST API.

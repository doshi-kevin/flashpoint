# Janvi's ideas: Hack the Unreachable

**Event:** Hack the Unreachable, an AI research hackathon powered by Flashpoint.AI · Fordham Lincoln Center · Nov 14, 2026
**Team:** Janvi, Aditya, Kevin
**My role:** UI/UX, the platform dashboard, and the presentation

---

## Current direction (read this first)

### Casefile: the AI detective for real estate investors
*"Data tells you what. People tell you why."*

**User:** Daniel, an asset manager at a retail property group that owns 12 neighborhood shopping streets and centers in NYC.

**Problem:** At one property, foot traffic is down 20% and 3 tenants won't renew. Placer.ai shows the drop. CoStar shows the vacancies. **Neither explains why.** Daniel has weeks to decide: cut rents, recruit different tenants, renovate, or sell. Each choice is worth millions.

**Solution:** AI agents investigate the property like detectives, then use **Flashpoint** to question the people who stopped showing up. The verdict says whether the decline is **temporary or structural**, with evidence and a recommended action.

**How the detectives work:**
1. **Open the case:** traffic and leasing data show when and where the drop happened.
2. **Collect clues:** agents search permits, construction, competing developments, transit changes, rents, news and local sentiment.
3. **Name suspects:** construction, a new mall nearby, changing demographics, tenant mix, rent levels.
4. **Check alibis:** a Challenger agent clears suspects the evidence doesn't support.
5. **Question witnesses (Flashpoint):** nearby residents and workers, people who stopped visiting, and tenants.
6. **Close the case:** a temporary or structural verdict, the evidence, the suspects cleared, and what to do.

**Demo story:** Everyone assumes the neighborhood is dying. The agents find a **construction project blocking the subway exit, ending in March.** Shoppers say they'd come back.
- **Before:** "Sell at a discount."
- **After:** "Hold. Give tenants 3 months of rent relief. Re-check in April."

**Pitch line:** *"CoStar and Placer.ai tell investors what's happening on a street. Casefile tells them why, by asking the people who stopped showing up."*

---

## How Flashpoint fits (from docs.flashpoint.ai)

Flashpoint is a research platform. You describe a research goal; it plans the study, recruits respondents, fields the survey, analyzes the data and returns results. It's available through a chat UI, an **MCP server** (`https://api.flashpoint.ai/mcp`) and a REST API.

**What we use:**
| Need | Flashpoint feature |
|---|---|
| Agent creates the study itself | MCP server, `tool_survey` tool (takes a plain-English brief) |
| Real people near the property | **Prolific** sample, filtered by `us_state`, age, employment, plus a **`zipcode`** screener question |
| Former visitors or tenants | **First-party panel + email distribution**, each person gets a unique tokenized link |
| People on the street | **Public link / QR code** (`flashpoint.ai/s/{survey_id}`) |
| Personal follow-up questions | **`ai-chat`** question type: the AI probes deeper based on earlier answers |
| "Show us where" | **`image_hotspot`**: people tap a photo or map where their trip changed |
| Ranking fixes | **`maxdiff`** |
| Clean data | **`detect_speeders`**, **`detect_straightliners`**, response exclusion |
| Themes and quotes | **`analyze_open_ends`**, **`summarize_results`** |
| Export to our case file | CSV / XLSX export |

**Limits to plan around:**
- Prolific takes about **24–48 hours**, so launch early and use the QR link in the room for same-day answers.
- Prolific targeting goes to **US state**, not city or zip, so use the `zipcode` screener.
- **Synthetic respondents** exist (minutes, included). Use them only to test the survey, never as evidence. Label clearly.
- Docs don't say how deep `ai-chat` probes, and there's no general "response completed" webhook. Pull results by export or MCP.

**Questions for the Flashpoint team:**
1. Can we get MCP or API access for the event?
2. Can a small Prolific sample come back today?
3. Can an `ai-chat` opening use earlier answers?

### Our research is an investigation, not a generic survey
- **Every question rules out a suspect.** E.g. "When did you last visit?" (timing vs. construction start) and "How did you get here?" (transit vs. parking).
- **Ask about what happened, not opinions.** "The last time you came, what happened?" beats "rate 1–5." Open question first, so we don't lead.
- **Compare who left with who stayed.** The difference between the two groups reveals the cause.
- **The Challenger picks the next question** based on what's unresolved, and stops once the cause is clear.

---

## Wow factor
1. **The twist verdict:** "temporary, not structural." A blocked subway exit, not a dying neighborhood.
2. **Judges become witnesses:** they scan a QR code and their answers move the case board live.
3. **The "why" map:** taps cluster on one corner of the street photo.
4. **The case board:** suspects crossed off live as alibis are found.
5. **The money flip:** "Sell at a discount" → "Hold and give rent relief."

## Pitching factors
| Factor | Line |
|---|---|
| Clear pain | "Investors see traffic drop and tenants leave, but no tool tells them why." |
| Real money | "One wrong hold-or-sell decision is worth millions. An investigation costs a few thousand." |
| Clear gap | "CoStar shows vacancies. Placer.ai shows foot traffic. Nobody asks the people who stopped coming." |
| Flashpoint essential | "Without Flashpoint, the case stays unsolved." |
| Real agents | "Agents find clues, name suspects, challenge each other, then design the research that closes the case." |
| Honest AI | "Every claim links to evidence. The verdict says what we know, what we don't, and what to check next." |
| All three tracks | Economic signals (hyperlocal), investment (hold or sell), governance (findings the city can act on) |
| Business model | Per investigation or yearly per portfolio; high margin; a data moat from every case |
| Human impact | "Keeping a shopping street alive keeps local shops and jobs alive." |

**20-second pitch:** *"An investor sees foot traffic drop 20% and tenants leaving. CoStar says what's happening, Placer.ai says how many fewer people came. Nobody says why. Casefile sends AI detectives to investigate, then uses Flashpoint to ask the people who stopped showing up. Here, the verdict was a blocked subway exit, not a dying neighborhood. Don't sell. Hold. A multi-million-dollar decision, made on evidence instead of a guess."*

## The business
- **Customers:** commercial real estate owners and investors first; then retail chains' real estate teams, small-business lenders, and cities.
- **Why they'd pay:** they already pay for CoStar and Placer.ai, which show *what*. We show *why*.
- **Pricing:** per investigation, or yearly per portfolio.
- **Costs:** Flashpoint respondents (docs example: about $2.45 per Prolific complete) plus AI usage.
- **Moat:** every case builds a library of what actually causes neighborhood decline and recovery.

---

## Judging criteria check
| # | Criterion | How we hit it |
|---|---|---|
| 01 | Innovation | Asks the people who left; detective-style research; left vs. stayed comparison |
| 02 | Theme alignment | Reaches unreachable people through Flashpoint; Economic Signals track |
| 03 | Technical execution | Real agents with web search, a shared evidence file, Challenger, Flashpoint via MCP |
| 04 | Functionality | One full loop working live: case → clues → suspects → Flashpoint → verdict |
| 05 | UX & accessibility | One case-board screen, plain language, mobile-friendly, keyboard and screen-reader support |
| 06 | Potential impact | Avoids wrong multi-million-dollar decisions; keeps shopping streets and jobs alive |
| 07 | Feasibility | Built on Flashpoint, Claude and public data; clear buyer and pricing |
| 08 | Storytelling | One investor, one property, one surprising verdict, one decision flip |

**Judges:** Anna Kim (eBay, AI Innovation) · Rathna Devanand (Zillow, Sr. SWE) · Kalpit Munot (Meta, Sr. SWE) · Evan Katsamakas (Fordham, MS AI in Business) · Jorge Martinez Navarrete (UN Innovation Unit) · Ytam Segal (co-founder, likely Flashpoint).
- Three engineers → it must really work; show the agent trace and sources.
- Zillow → real estate and neighborhoods fit directly.
- UN → communities, local jobs, fairness.
- Flashpoint → it must be essential, not a logo.

---

## UI/UX and dashboard plan (my part)

**Screen 1: Portfolio overview**
- The 12 properties, ranked by what needs attention.
- Each row: traffic change, vacancy, case status ("Investigating", "Verdict ready", "Healthy").

**Screen 2: The case board (main demo screen)**
- **Timeline:** foot traffic over time, with clues pinned on it (construction start, new mall opening).
- **Suspect cards:** each with evidence for, evidence against, and status (cleared / plausible / confirmed).
- **Witness panel:** live Flashpoint responses, quotes, left vs. stayed comparison.
- **"Why" map:** heatmap of taps from `image_hotspot`.
- **Agent trace:** what each agent did, with sources.

**Screen 3: Verdict brief**
- Temporary or structural, and how sure.
- Evidence summary, suspects cleared, what's still unknown.
- **Decision card:** before vs. after, with the recommended action, owner and review date.

**UX rules:**
- Uncertainty shown as words (strong / plausible / weak), never fake percentages.
- Every claim links to its source.
- Status never shown by color alone.
- Readable in under a minute; works on a phone.
- Label demo or synthetic data clearly.

---

## Presentation plan (my part)

**4-minute arc:**
1. **Hook (20s):** *"A restaurant gave me bad service, then offered me a free ice cream for a 5-star review. They got the review. I got a bad ice cream. The next customer got a lie. Data and stars don't tell you why."*
2. **The case (40s):** Daniel's property, traffic down 20%, tenants leaving. Sell or hold?
3. **The investigation (60s):** agents collect clues; the Challenger crosses off suspects live.
4. **The witnesses (60s):** *"Scan this. You're a shopper on this street."* Real answers arrive; the map lights up at the blocked subway exit.
5. **The verdict (40s):** temporary, not structural. Hold, don't sell.
6. **Close (20s):** *"Data tells you what. People tell you why. Casefile asks them."*

**Submission checklist:** public GitHub repo with README and architecture diagram · live demo link · 60–90 sec backup video (record around 3:00 PM) · LinkedIn or X post.

---

## Name ideas
- **Detective:** Casefile ⭐, Motive, Alibi, Witness
- **The "why":** WhyLine, Because, Root
- **Place:** StreetSignal, Corner
- **Unreachable voices:** Unheard, Walkaway, Last Visit
- **Original:** Economic Pulse (clear but generic; "Pulse" is common)

Check names for existing products before committing.

---

## How we got here (idea history)

### 1. First brainstorm, one idea per track
- **Investment Alpha: "Say–Do Gap"**: compare what's priced into a stock with what a key group privately believes. **Ruled out.**
- **Self-Improving AI: "Ask the Room"**: AI flags what it doesn't know, asks real people, updates its answer.
- **Governance: "Common Ground"**: private interviews on a divisive issue, then statements every group agrees with.
- **Economic Signals: "Main Street Pulse"**: hyperlocal index from small businesses and gig workers.
- **News: "Source Check"**: verify a viral claim by interviewing the people affected.

### 2. Reference: last Fordham winner, Concord Lite
A layer that reads a multi-agent run, finds which contract broke, recommends a precise fix and generates a regression test. Lessons: specific actionable output, agents with clear separate jobs, sponsors' tools doing real work, a way to prove it works, and a complete submission (demo, video, repo).

### 3. Agents that debate and improve, with a human approving
Answerer and Critic agents argue, a Judge decides, a human approves, and corrections are saved as lessons. Gap: no clear user.

### 4. Blindspot: assumption checker for product teams
Agents find the riskiest assumptions in a PM's plan, the PM approves which to test, Flashpoint asks real target users, the plan updates, and the system remembers.
- Competitors: assumption-finding tools (Microsoft Lacuna agent, PM prompt skills) stop at a list; AI interview tools (Outset, Listen Labs, Strella, GetWhy, Maze) run studies you design but don't find your blind spots; synthetic users are directional only.
- Moved on: wanted an idea not built on ThinFile's themes, and a stronger economic angle.

### 5. Economic Pulse: why is one store losing sales? (store level)
- **User:** Raj, a franchise owner with 6 stores.
- **Story:** a Subway near Lincoln Center, 4.5 stars, lunch sales down 18%. Suspects: unfriendly service, charging for extras that competitors give free, construction (noise, scaffolding), no cell network. **Verdict:** scaffolding killed the cell signal, so card and app payments fail. Fix: a signal booster and a pickup shelf, not a discount.
- **Key insights we keep:**
  - *"4.5 stars measures the people who came. Sales measure the people who stopped coming."*
  - *"Stars can be bought."* Incentivized reviews (like the ice-cream-for-5-stars story) are banned by the FTC's 2024 rule and by Google and Yelp, but still happen. Add a **review integrity check**: bursts of short 5-star reviews, mentions of free items, ratings rising while sales fall.
  - **Fairness rule:** never describe or judge staff by race, ethnicity or gender. Test behaviors, not people, and report in aggregate.
- **Competitors:** AI root-cause tools using internal data (Scoop, Databricks QSR Control Tower, FranConnect, PAR Coach AI, Oscar AI); guest feedback platforms that only hear current customers (Tattle, Ovation, Black Box Intelligence, InMoment); Placer.ai for foot traffic; review management tools.
- **Respondent thank-yous:** same reward whatever people say; let them choose store credit, a small gift card or a donation; one per person; track coupon redemptions separately so they don't distort results. Choosing store credit is itself a "winnable customer" signal.
- **Fraud protection:** unique tokenized links, rewards usable only in-store and only after a valid response, Flashpoint's speeder and straightliner detection, and the rule that a finding must appear in at least two independent sources.
- **Flashpoint is research, not marketing:** use it to diagnose, test fixes and measure. Win-back messages go through the business's own channels, only to people who opted in.
- **Moved on:** restaurant surveys are already a normal Flashpoint use, and the sponsor emphasized economics, governance and investment.

### 6. Street level: why is a neighborhood's main street dying?
Same detective engine applied to a commercial corridor, with one engine feeding three outputs: economic signal, governance brief, investment signal. User narrowed to a BID executive director. **Moved on:** BIDs have small budgets; wanted a stronger business.

### 7. Current: Casefile for commercial real estate investors
See the top of this file. Other paying customers considered: retail chains' site-strategy teams (close, fix or relocate) and small-business lenders (neighborhood credit risk).

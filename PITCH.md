# Economic Pulse: pitch, structure and script

Written for: judges and Flashpoint staff. Presenters: Aditya (opens) and Kevin (demo).

## 1. The idea as a structure

**One line:** An agent that researches a new market for you, knows what the internet can't tell it, and goes and asks real people through Flashpoint.

**The user:** Kevin owns a burger chain with 50 stores. He is opening Store 51 in a region he has never visited.

**His three blind spots:** the economics of the place, how locals feel about burger chains, and what price will work.

**The flow (one workspace, `/expansion`):**

| Step | Who does it | Source |
|---|---|---|
| 1. Kevin types a region | Kevin | input |
| 2. The agent asks Flashpoint what it can do | Agent | Flashpoint MCP `tools/list` (self-discovery) |
| 3. The agent picks `demographics` and calls it | Agent | Flashpoint MCP |
| 4. Economics written from those figures only | Claude | no invented numbers |
| 5. Public sentiment labeled Observed / Inferred / Unknown | Claude | public signals |
| 6. The agent states the gap: "The internet doesn't know what locals will pay" | Claude | |
| 7. It designs ONE pricing question with 3 price options | Claude | |
| 8. Real people answer by QR code | Flashpoint survey | open link |
| 9. Synthetic customers predict first, real answers correct them | Flashpoint panel | learn from the gap |

**Where the agents sit:** Detective (names suspects), Challenger (tries to clear them), Expansion agent (discovers Flashpoint tools, calls the safe ones). Paid or publishing tools are listed to the agent but never run by it. A human approves spend.

**Where Flashpoint sits:** (a) the agent discovers Flashpoint's tools on its own, (b) demographics for the economics, (c) synthetic panel for the prediction, (d) survey and real respondents for the truth.

**Existing flow kept:** the Cases view investigates a store whose sales dropped, with the same pattern (investigate, admit the gap, ask, learn).

## 2. Business impact (say it plainly)

- A new store is a lease, build-out and staff: commonly several hundred thousand dollars. A wrong price or a wrong region is expensive and slow to undo.
- Today Kevin would hire a consultant for weeks, or guess. Here it takes minutes and the question goes to real people.
- Cost of research is small: our full Store 14 synthetic panel of 30 people finished in about a minute. A real 10-person paid sample quotes at $18.63, a rounding error next to a lease.
- The agent says what it does not know. That is the trust: it never invents a number, and it names the one question worth asking.
- Relatable: every owner has opened a place on a hunch. This replaces the hunch with one good question.

## 3. The script (about 3 minutes)

**Aditya (opens):** "Hey, meet my friend Kevin. Kevin runs fifty burger stores. Next month he opens number fifty-one, in a city he has never set foot in. He doesn't know the neighborhood, he doesn't know what people there think of burger chains, and he has no idea what to charge. Today he'd guess, or pay a consultant and wait weeks. A wrong guess costs him a lease."

**Kevin:** "So I opened Economic Pulse and typed one thing: Raleigh, North Carolina."

*(Click Research this region. The steps appear.)*

**Kevin:** "Watch the first step. I didn't tell the agent to use Flashpoint. It asked Flashpoint what it can do, saw a list of tools, and chose demographics itself. That's an agent finding its own capabilities."

**Aditya:** "And it only uses what's safe. Paid tools and publishing are on the list, but the agent can't touch them. A person approves any spend."

*(Economics card shows.)*

**Kevin:** "Now the economics. Population, income, age, straight from Flashpoint. Every number in that paragraph came from the tool, not from the model's imagination. It even warns me the data is low confidence. I'd rather know that."

*(Sentiment card shows.)*

**Kevin:** "Public sentiment, each line labeled: Observed, Inferred, or Unknown. And look at the orange box. 'The internet doesn't know.' It can't tell me what a Raleigh lunch crowd will actually pay. Nobody can, from a desk."

**Aditya:** "So it does the thing most tools skip. It admits what it can't know, and it turns that into one question: how much would you pay for a burger combo at lunch? Three options. Not ten. Choose, don't rate."

*(Point at the QR code.)*

**Kevin:** "Flashpoint's synthetic customers predict the answer first. Then real people answer. Scan this and you're the real people." *(Audience scans.)* "The gap between what the AI predicted and what you said is how the system learns."

**Aditya (closes):** "We said it at the start: Claude knows what it doesn't know. Flashpoint goes and asks. Kevin opens store fifty-one with data from the people who will actually walk through the door, in minutes, not weeks."

**Q&A prep**
- *Is the sentiment real?* The labels say what is observed and what is inferred. Any news or precedent panel in the app is sample data and says so.
- *Does it spend money?* No. The agent cannot call paid tools. Real recruitment is a human-approved Stripe step.
- *What about the QR responses?* They are real people through Flashpoint's open survey link. The "real" bars in the demo's store view are sample data until responses arrive.

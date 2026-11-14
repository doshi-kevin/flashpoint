// Creates a one-question Flashpoint survey, publishes it (free open link, no spend) and prints the public link.
// Usage: node scripts/create-publish-survey.cjs "<title>" "<question>" "<opt1>|<opt2>|<opt3>"
const os = require("os"), path = require("path");
const cfg = require(path.join(os.homedir(), ".claude.json")).mcpServers.flashpoint;
const [title, question, optsRaw] = process.argv.slice(2);
const opts = optsRaw.split("|");
const H = { ...cfg.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const post = async (b, x = {}) => { const r = await fetch(cfg.url, { method: "POST", headers: { ...H, ...x }, body: JSON.stringify(b) }); return { r, t: await r.text() }; };
(async () => {
  const i = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "pulse", version: "1" } } });
  const x = { "mcp-session-id": i.r.headers.get("mcp-session-id") };
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, x);
  let n = 2;
  const ask = async (brief, cid, sid) => {
    const args = { brief };
    if (cid) args.conversation_id = cid;
    if (sid) args.survey_id = sid;
    const c = await post({ jsonrpc: "2.0", id: n++, method: "tools/call", params: { name: "tool_survey", arguments: args } }, x);
    const m = [...c.t.matchAll(/data: (.*)/g)].map((y) => JSON.parse(y[1])).find((o) => o.id);
    return JSON.parse(m.result.content[0].text).result;
  };
  const a = await ask(`Create a DRAFT survey, do not publish or spend. Title: ${title}. One single-choice question Q1: "${question}" Options in order: ${opts.join("; ")}. No other questions.`);
  console.log("created", a.survey_id);
  const b = await ask("Publish now. Free open link only, no recruitment, no spend, no emails. Yes to publishing without quotas.", a.conversation_id, a.survey_id);
  const c = await ask("confirm", a.conversation_id, a.survey_id);
  console.log("SURVEY_ID", a.survey_id);
  console.log("LINK", (c.final_text.match(/flashpointopinions\.com\/[a-z0-9-]+/i) || [""])[0]);
})().catch((e) => console.error("ERR", e.message));

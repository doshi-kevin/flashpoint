// Asks the Flashpoint surveys agent for Q1 answer counts of a survey and prints them (read-only).
const os = require("os"), path = require("path");
const cfg = require(path.join(os.homedir(), ".claude.json")).mcpServers.flashpoint;
const surveyId = process.argv[2] || process.env.FLASHPOINT_STUDY_SURVEY_ID || "8687611b-958a-4d90-a320-5d58a865a608";
const H = { ...cfg.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const post = async (body, extra = {}) => { const r = await fetch(cfg.url, { method: "POST", headers: { ...H, ...extra }, body: JSON.stringify(body) }); return { r, t: await r.text() }; };
(async () => {
  const i = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "pulse", version: "1" } } });
  const x = { "mcp-session-id": i.r.headers.get("mcp-session-id") };
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, x);
  const brief = "READ ONLY. Do not publish, recruit or spend. For this survey, report the answer counts for Q1 (Extra cheese, $1 off, Faster line) across ALL completed responses, including synthetic panel responses. Reply with just the three counts and the total.";
  const c = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "tool_survey", arguments: { brief, survey_id: surveyId } } }, x);
  const m = [...c.t.matchAll(/data: (.*)/g)].map((y) => JSON.parse(y[1])).find((o) => o.id);
  const txt = m?.result?.content?.[0]?.text;
  try { console.log(JSON.parse(txt).result.final_text); } catch { console.log((txt ?? c.t).slice(0, 1500)); }
})();

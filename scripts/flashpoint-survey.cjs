// Sends a brief to the Flashpoint surveys agent. Usage: node scripts/flashpoint-survey.cjs "<brief>" [conversation_id]
const os = require("os"), path = require("path");
const cfg = require(path.join(os.homedir(), ".claude.json")).mcpServers.flashpoint;
const SID = process.env.FLASHPOINT_STUDY_SURVEY_ID || "8687611b-958a-4d90-a320-5d58a865a608";
const H = { ...cfg.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const post = async (body, extra = {}) => { const r = await fetch(cfg.url, { method: "POST", headers: { ...H, ...extra }, body: JSON.stringify(body) }); return { r, t: await r.text() }; };
(async () => {
  const i = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "pulse", version: "1" } } });
  const x = { "mcp-session-id": i.r.headers.get("mcp-session-id") };
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, x);
  const args = { brief: process.argv[2], survey_id: SID };
  if (process.argv[3]) args.conversation_id = process.argv[3];
  const c = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "tool_survey", arguments: args } }, x);
  const m = [...c.t.matchAll(/data: (.*)/g)].map((y) => JSON.parse(y[1])).find((o) => o.id);
  console.log((m?.result?.content?.[0]?.text ?? c.t).slice(0, 4000));
})();

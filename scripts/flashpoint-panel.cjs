// Runs a free synthetic panel on the Store 14 survey via the Flashpoint MCP server and prints the result.
// Usage: node scripts/flashpoint-panel.cjs [survey_id] [num_respondents]
// Reads the MCP bearer token from ~/.claude.json (never printed).
const os = require("os"), path = require("path");
const cfg = require(path.join(os.homedir(), ".claude.json")).mcpServers.flashpoint;
const surveyId = process.argv[2] || process.env.FLASHPOINT_STUDY_SURVEY_ID || "8687611b-958a-4d90-a320-5d58a865a608";
const n = Number(process.argv[3] || 30);
const H = { ...cfg.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const post = async (body, extra = {}) => {
  const r = await fetch(cfg.url, { method: "POST", headers: { ...H, ...extra }, body: JSON.stringify(body) });
  return { r, t: await r.text() };
};
const parse = (t) => {
  const m = [...t.matchAll(/data: (.*)/g)].map((x) => JSON.parse(x[1])).find((o) => o.id);
  const txt = m?.result?.content?.[0]?.text;
  try { return JSON.parse(txt); } catch { return txt ?? t.slice(0, 500); }
};
(async () => {
  const i = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "pulse", version: "1" } } });
  const x = { "mcp-session-id": i.r.headers.get("mcp-session-id") };
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, x);
  const call = async (id, args) => parse((await post({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "panel", arguments: args } }, x)).t);
  const start = await call(2, { action: "create_and_run", name: "Store 14 lapsed lunch customers", num_respondents: n,
    research_objective: "Lapsed weekday lunch customers of a bakery-cafe chain store with a drive-thru; understand what would bring them back.", survey_id: surveyId });
  console.log("start:", JSON.stringify(start).slice(0, 600));
  const jobId = start?.result?.job_id || start?.job_id;
  if (!jobId) return;
  for (let k = 0; k < 8; k++) {
    await new Promise((r) => setTimeout(r, 15000));
    const st = await call(10 + k, { action: "status", job_id: jobId });
    console.log("status:", JSON.stringify(st).slice(0, 700));
    const s = st?.result?.status || st?.status;
    if (s && s !== "running") break;
  }
})();

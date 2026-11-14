// Prints the raw (trimmed) Flashpoint demographics response for a location. Usage: node scripts/probe-demographics.cjs "Raleigh, North Carolina"
const os = require("os"), path = require("path");
const cfg = require(path.join(os.homedir(), ".claude.json")).mcpServers.flashpoint;
const H = { ...cfg.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
const post = async (b, x = {}) => { const r = await fetch(cfg.url, { method: "POST", headers: { ...H, ...x }, body: JSON.stringify(b) }); return { r, t: await r.text() }; };
(async () => {
  const i = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "p", version: "1" } } });
  console.log("init status", i.r.status);
  const x = { "mcp-session-id": i.r.headers.get("mcp-session-id") };
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, x);
  const c = await post({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "demographics", arguments: { location: process.argv[2] || "Raleigh, North Carolina" } } }, x);
  console.log("call status", c.r.status);
  const m = [...c.t.matchAll(/data: (.*)/g)].map((y) => JSON.parse(y[1])).find((o) => o.id);
  const txt = m?.result?.content?.[0]?.text ?? c.t;
  let j; try { j = JSON.parse(txt); } catch { console.log(String(txt).slice(0, 400)); return; }
  console.log("top keys", Object.keys(j), "result keys", j.result && Object.keys(j.result));
  const d = j.result && j.result.demographics;
  console.log("pop", d && d.age && d.age.totalPopulation, "income", d && d.income && d.income.medianHouseholdIncome, "meta", JSON.stringify(j.result && j.result.metadata).slice(0, 200));
  if (!d) console.log(JSON.stringify(j).slice(0, 500));
})();

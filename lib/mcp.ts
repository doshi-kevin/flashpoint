// Minimal Flashpoint MCP client (streamable HTTP, server-side only).
// Token: FLASHPOINT_MCP_TOKEN (never sent to the browser). Used for tool discovery and read-only calls.
const URL_ = process.env.FLASHPOINT_MCP_URL || "https://api.flashpoint.ai/mcp";

export type McpTool = { name: string; description: string; inputSchema: Record<string, unknown> };

async function rpc(body: object, sid?: string) {
  const token = process.env.FLASHPOINT_MCP_TOKEN;
  if (!token) throw new Error("FLASHPOINT_MCP_TOKEN not set");
  const res = await fetch(URL_, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(sid ? { "mcp-session-id": sid } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);
  const text = await res.text();
  const msgs = [...text.matchAll(/data: (.*)/g)].map((m) => JSON.parse(m[1]));
  const reply = msgs.find((m) => "id" in m) ?? (text.trim().startsWith("{") ? JSON.parse(text) : null);
  return { sid: res.headers.get("mcp-session-id") ?? sid, reply };
}

async function session() {
  const init = await rpc({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "economic-pulse", version: "1" } },
  });
  await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, init.sid);
  return init.sid;
}

/** Ask Flashpoint what it can do (the agent discovers its own capabilities). */
export async function listTools(): Promise<McpTool[]> {
  const sid = await session();
  const { reply } = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sid);
  return (reply?.result?.tools ?? []) as McpTool[];
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const sid = await session();
  const { reply } = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name, arguments: args } }, sid);
  const txt = reply?.result?.content?.[0]?.text;
  try { return JSON.parse(txt); } catch { return txt ?? reply; }
}

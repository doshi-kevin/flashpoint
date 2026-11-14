// Times the streaming /api/expansion route: when each event arrives. Usage: node scripts/time-expansion.cjs [region]
const t0 = Date.now();
fetch("http://localhost:3000/api/expansion", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ region: process.argv[2] || "Raleigh, North Carolina" }),
}).then(async (r) => {
  const rd = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await rd.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const ls = buf.split("\n");
    buf = ls.pop();
    for (const l of ls) {
      if (!l) continue;
      const e = JSON.parse(l);
      const s = ((Date.now() - t0) / 1000).toFixed(1);
      if (e.type === "kpis") console.log(s + "s KPIs", JSON.stringify(e.kpis));
      else if (e.type === "step") console.log(s + "s step:", e.step);
      else if (e.type === "result") console.log(s + "s RESULT", e.source);
      else if (e.type === "error") console.log(s + "s ERROR", e.message);
    }
  }
});

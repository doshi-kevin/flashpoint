// Times the Store 14 investigation route. Usage: node scripts/time-agent.cjs
const t0 = Date.now();
fetch("http://localhost:3000/api/agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ problem: "Why is Store 14 lunch down?", live: true }),
}).then(async (r) => {
  const d = await r.text();
  for (const l of d.trim().split("\n")) {
    const e = JSON.parse(l);
    if (e.type === "result") console.log(e.source, e.result.hypotheses.length, "suspects;", e.result.challenges?.length ?? 0, "challenged;", e.result.question.text);
    if (e.type === "error") console.log("ERR", e.message);
  }
  console.log("seconds", ((Date.now() - t0) / 1000).toFixed(1));
});

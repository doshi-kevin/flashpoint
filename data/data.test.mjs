// Data tests: shapes the app depends on, reproducibility, realism benchmarks and every planted
// story tell. Run: node --test data/data.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { generate, DAYPARTS, CHANNELS } from "./generate.mjs";
import { salesChangePct, anomaly } from "../lib/metrics.ts"; // Kevin's real functions (contract check)

const load = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
const sum = (xs) => xs.reduce((t, x) => t + x, 0);
const mean = (xs) => sum(xs) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (a, b) => (a / b - 1) * 100;
const dow = (d) => new Date(d + "T12:00:00Z").getUTCDay();

const stores = load("stores.json");
const profiles = load("store-profiles.json");
const sales = load("sales.json");
const traffic = load("traffic.json");
const events = load("events.json");
const signals = load("signals.json");
const weather = load("weather.json");
const quality = load("data-quality.json");
const ids = stores.map((s) => s.id);

const csvText = readFileSync(new URL("pos/daily_daypart_channel.csv", import.meta.url), "utf8");
const rows = csvText
  .trim()
  .split("\n")
  .slice(1)
  .map((l) => {
    const [date, store, daypart, channel, tx, net, svc] = l.split(",");
    return { date, store, daypart, channel, tx: Number(tx), net: Number(net), svc: svc ? Number(svc) : null };
  });
const DAYS = [...new Set(rows.map((r) => r.date))].sort();
const RECENT_START = "2026-10-26"; // same windows as lib/metrics.ts: last 3 weeks vs the 6 before
const BASE_START = "2026-09-14";
const inRecent = (d) => d >= RECENT_START;
const inBase = (d) => d >= BASE_START && d < RECENT_START;
const isWeekday = (d) => dow(d) >= 1 && dow(d) <= 5;

/** Weekday change % for a filter over POS rows of one store (avg per weekday, recent vs base). */
function change(store, filter, field = "net") {
  const per = (pred) => {
    const byDay = {};
    for (const r of rows) if (r.store === store && filter(r) && isWeekday(r.date) && pred(r.date)) byDay[r.date] = (byDay[r.date] ?? 0) + r[field];
    return mean(Object.values(byDay));
  };
  return pct(per(inRecent), per(inBase));
}

// ---- Files and shapes -------------------------------------------------------------------------

test("every data file is valid JSON", () => {
  for (const f of readdirSync(new URL(".", import.meta.url)).filter((f) => f.endsWith(".json")))
    assert.doesNotThrow(() => load(f), f);
});

test("all generated files match the generator byte-for-byte (reproducible)", () => {
  const g = generate();
  assert.equal(g.csv, csvText);
  assert.deepEqual(g.sales, sales);
  assert.deepEqual(g.traffic, traffic);
  assert.deepEqual(g.stores, stores);
  assert.deepEqual(g.profiles, profiles);
  assert.deepEqual(g.weather, weather);
  assert.deepEqual(g.events, events);
  assert.deepEqual(g.dataQuality, quality);
  assert.deepEqual(g.calendar, load("calendar.json"));
  assert.deepEqual(g.replay, load("flashpoint-replay.json"));
});

test("stores.json keeps the Store shape; original demo stores still exist", () => {
  assert.equal(stores.length, 40);
  assert.equal(new Set(ids).size, 40);
  for (const s of stores) assert.deepEqual(Object.keys(s), ["id", "name", "chain", "area"]);
  for (const id of ["11", "12", "14", "17", "21"]) assert.ok(ids.includes(id), id);
  assert.equal(stores.find((s) => s.id === "14").area, "Harbor Street");
  for (const id of ids) assert.ok(profiles[id], `profile ${id}`);
});

test("sales.json / traffic.json: weekday-only, same dates, frozen keys", () => {
  for (const id of ids) {
    assert.equal(sales[id].length, 65, id);
    sales[id].forEach((p, i) => {
      assert.deepEqual(Object.keys(p), ["date", "sales"]);
      assert.deepEqual(Object.keys(traffic[id][i]), ["date", "visits", "avgTicket"]);
      assert.equal(traffic[id][i].date, p.date);
      assert.ok(isWeekday(p.date), p.date);
    });
  }
});

test("events and signals use only the types/labels in lib/types.ts", () => {
  for (const [id, list] of Object.entries(events)) {
    assert.ok(ids.includes(id));
    for (const e of list) assert.ok(["rain", "roadworks", "competitor"].includes(e.type), e.type);
  }
  for (const [id, list] of Object.entries(signals)) {
    assert.ok(ids.includes(id));
    for (const s of list) {
      assert.deepEqual(Object.keys(s), ["id", "source", "text", "label"]);
      assert.ok(["Observed", "Inferred", "Unknown"].includes(s.label));
    }
  }
});

// ---- POS integrity ----------------------------------------------------------------------------

test("POS table: every store x day x daypart x channel it offers, no negatives, sane tickets", () => {
  for (const id of ids) {
    const channels = CHANNELS.filter((c) => c !== "drive_thru" || profiles[id].hasDriveThru);
    assert.equal(rows.filter((r) => r.store === id).length, DAYS.length * DAYPARTS.length * channels.length, id);
  }
  for (const r of rows) {
    assert.ok(r.tx >= 0 && r.net >= 0);
    if (r.tx > 0) assert.ok(r.net / r.tx > 4 && r.net / r.tx < 30, `ticket ${r.net / r.tx}`);
    assert.equal(r.svc !== null, r.channel === "drive_thru" && r.tx > 0);
  }
});

test("roll-ups: sales.json and traffic.json are exactly the weekday lunch sums of the POS table", () => {
  const lunch = {};
  for (const r of rows)
    if (r.daypart === "lunch") {
      const k = r.store + "|" + r.date;
      lunch[k] ??= { tx: 0, net: 0 };
      lunch[k].tx += r.tx;
      lunch[k].net += r.net;
    }
  for (const id of ids)
    sales[id].forEach((p, i) => {
      const l = lunch[id + "|" + p.date];
      assert.ok(Math.abs(p.sales - l.net) < 0.006, `${id} ${p.date}`);
      assert.equal(traffic[id][i].visits, l.tx);
      assert.ok(Math.abs(traffic[id][i].avgTicket - p.sales / l.tx) <= 0.005 + 1e-9);
    });
});

// ---- Realism benchmarks (see data/README.md for sources and assumptions) ------------------------

test("benchmarks: AUV, average check, channel and daypart mix look like a US burger QSR", () => {
  const byStore = (id, f = () => true) => sum(rows.filter((r) => r.store === id && f(r)).map((r) => r.net));
  const dt = ids.filter((id) => profiles[id].format === "drive_thru");
  const auv = dt.map((id) => (byStore(id) / DAYS.length) * 365);
  assert.ok(median(auv) > 3.6e6 && median(auv) < 4.6e6, `drive-thru AUV median ${median(auv)}`); // ~$4.09M (QSR 2025)
  const check = sum(rows.map((r) => r.net)) / sum(rows.map((r) => r.tx));
  assert.ok(check > 9 && check < 13, `average check ${check}`);
  const dtShare = median(dt.map((id) => byStore(id, (r) => r.channel === "drive_thru") / byStore(id)));
  assert.ok(dtShare > 0.6 && dtShare < 0.78, `drive-thru share ${dtShare}`);
  const delShare = median(dt.map((id) => byStore(id, (r) => r.channel === "delivery") / byStore(id)));
  assert.ok(delShare > 0.06 && delShare < 0.16, `delivery share ${delShare}`);
  const lunchShare = median(ids.map((id) => byStore(id, (r) => r.daypart === "lunch") / byStore(id)));
  assert.ok(lunchShare > 0.25 && lunchShare < 0.42, `lunch share ${lunchShare}`);
});

test("benchmarks: weekly rhythm — drive-thru stores busiest Fri/Sat, offices busiest midweek", () => {
  const byDow = (id) => {
    const out = Array.from({ length: 7 }, () => []);
    const day = {};
    for (const r of rows) if (r.store === id) day[r.date] = (day[r.date] ?? 0) + r.tx;
    for (const [d, v] of Object.entries(day)) out[dow(d)].push(v);
    return out.map(mean);
  };
  const dt = byDow("1");
  assert.ok(Math.min(dt[5], dt[6]) > Math.max(dt[1], dt[2]), "drive-thru: Fri/Sat > Mon/Tue");
  const office = byDow("17");
  assert.ok(office[3] > office[0] * 1.4 && office[3] > office[6] * 1.25, "Central Station: weekdays >> weekend");
});

// ---- Story tells ------------------------------------------------------------------------------

const comps = profiles["14"].comparisonStores;

test("Store 14: weekday lunch down ~19%, a clear outlier, flagged by Kevin's rule — and only Store 14", () => {
  const c14 = salesChangePct(sales["14"]);
  assert.ok(c14 < -15 && c14 > -23, `store 14 ${c14.toFixed(1)}%`);
  assert.equal(anomaly(sales["14"]).flagged, true);
  for (const id of ids.filter((i) => i !== "14")) {
    assert.equal(anomaly(sales[id]).flagged, false, `anomaly ${id}`);
    assert.ok(salesChangePct(sales[id]) > -10, `portfolio flag ${id}: ${salesChangePct(sales[id]).toFixed(1)}`);
  }
  const compAvg = mean(comps.map((id) => salesChangePct(sales[id])));
  assert.ok(compAvg > -5, `comparison stores ${compAvg.toFixed(1)}%`);
  assert.ok(c14 - compAvg < -12, "gap vs comparison stores is wide");
});

test("Store 14: it's visits, not spend — ticket moves with the chain (price rise), not against it", () => {
  const lunch = (r) => r.daypart === "lunch";
  const v14 = change("14", lunch, "tx");
  assert.ok(v14 < -15, `visits ${v14.toFixed(1)}%`);
  const t = (id) => {
    const tr = traffic[id];
    const r = tr.filter((d) => inRecent(d.date));
    const b = tr.filter((d) => inBase(d.date));
    return pct(sum(r.map((d) => d.visits * d.avgTicket)) / sum(r.map((d) => d.visits)), sum(b.map((d) => d.visits * d.avgTicket)) / sum(b.map((d) => d.visits)));
  };
  const peer = median(ids.filter((i) => i !== "14").map(t));
  assert.ok(Math.abs(t("14") - peer) < 2.5, `ticket 14 ${t("14").toFixed(1)} vs chain ${peer.toFixed(1)}`);
});

test("Store 14: lunch-hours only (lane closed 10:00-15:00): breakfast and dinner barely move", () => {
  const dp = (d) => change("14", (r) => r.daypart === d);
  assert.ok(dp("lunch") < -15);
  assert.ok(dp("breakfast") > -6, `breakfast ${dp("breakfast").toFixed(1)}`);
  assert.ok(dp("dinner") > -6, `dinner ${dp("dinner").toFixed(1)}`);
  assert.ok(dp("lunch") < dp("afternoon") && dp("afternoon") < dp("dinner"));
});

test("Store 14: drive-thru and walk-in fall at lunch, delivery holds", () => {
  const ch = (c) => change("14", (r) => r.daypart === "lunch" && r.channel === c, "tx");
  assert.ok(ch("drive_thru") < -15, `drive-thru ${ch("drive_thru").toFixed(1)}`);
  assert.ok(ch("counter") < -10, `counter ${ch("counter").toFixed(1)}`);
  assert.ok(ch("delivery") > -7, `delivery ${ch("delivery").toFixed(1)}`);
});

test("Store 14: lunch drive-thru service time jumps from 26 Oct; comparison stores don't", () => {
  const svc = (id, pred) => mean(rows.filter((r) => r.store === id && r.daypart === "lunch" && r.svc && pred(r.date)).map((r) => r.svc));
  const jump = (id) => svc(id, inRecent) - svc(id, inBase);
  assert.ok(jump("14") > 100, `store 14 +${jump("14").toFixed(0)} s`);
  for (const id of comps) assert.ok(Math.abs(jump(id)) < 15, `store ${id} ${jump(id).toFixed(0)} s`);
  const base = svc("14", inBase);
  assert.ok(base > 270 && base < 360, `baseline lunch service time ${base.toFixed(0)} s`);
});

test("timing: Store 14's sustained drop starts on the roadworks date, a week before the rival deal", () => {
  // Change point: the split that maximises the drop in Store 14's sales relative to its
  // comparison stores (removes chain-wide moves like the promo and the price rise).
  const s = sales["14"];
  const compDay = (i) => mean(comps.map((id) => sales[id][i].sales));
  const ratio = s.map((p, i) => p.sales / compDay(i));
  let best = { gap: 0, i: -1 };
  for (let k = 10; k < ratio.length - 5; k++) {
    const gap = mean(ratio.slice(0, k)) - mean(ratio.slice(k));
    if (gap > best.gap) best = { gap, i: k };
  }
  const ev = Object.fromEntries(events["14"].filter((e) => e.type !== "rain").map((e) => [e.type, e.date]));
  assert.equal(s[best.i].date, ev.roadworks);
  assert.ok(ev.competitor > s[best.i].date, "rival deal comes after the drop began");
});

test("local economy: Eastfield district (layoffs) is down together and trades down; not flagged", () => {
  const district = (d) => ids.filter((id) => profiles[id].district === d);
  const east = mean(district("Eastfield").map((id) => salesChangePct(sales[id])));
  const rest = mean(ids.filter((id) => profiles[id].district !== "Eastfield" && id !== "14").map((id) => salesChangePct(sales[id])));
  assert.ok(east < rest - 3, `Eastfield ${east.toFixed(1)} vs rest ${rest.toFixed(1)}`);
  assert.ok(signals["36"]?.some((s) => /layoff/i.test(s.text)), "Eastfield signal exists");
  assert.ok(signals["14"].some((s) => /no broad local pullback/i.test(s.text)), "Harbor area has no pullback");
});

test("rain: heavy-rain days are city-wide — walk-in down, delivery up, at nearly every store", () => {
  const rainDays = events["14"].filter((e) => e.type === "rain").map((e) => e.date);
  assert.deepEqual(rainDays, ["2026-11-03", "2026-11-10"]);
  const lunchTx = {};
  for (const r of rows) if (r.daypart === "lunch") lunchTx[`${r.store}|${r.date}|${r.channel}`] = r.tx;
  const shift = (d, k) => new Date(Date.parse(d + "T12:00:00Z") - k * 7 * 864e5).toISOString().slice(0, 10);
  for (const d of rainDays) {
    // vs the average of the same weekday in the 3 prior weeks (delivery counts are small and noisy)
    const refDays = [1, 2, 3, 4].map((k) => shift(d, k)).filter((x) => !rainDays.includes(x)).slice(0, 3);
    const ref = (id, c) => mean(refDays.map((x) => lunchTx[`${id}|${x}|${c}`]));
    const counterDown = ids.filter((id) => lunchTx[`${id}|${d}|counter`] < ref(id, "counter")).length;
    const deliveryUp = ids.filter((id) => lunchTx[`${id}|${d}|delivery`] > ref(id, "delivery")).length;
    // Store-level lunch counts are small (Poisson noise ~±13%), so require two-thirds of stores;
    // the chain-wide totals below must move clearly.
    assert.ok(counterDown >= 26 && deliveryUp >= 26, `${d}: counter down at ${counterDown}/40, delivery up at ${deliveryUp}/40`);
    const chain = (c, f) => sum(ids.map((id) => f(id, c)));
    assert.ok(pct(chain("counter", (id, c) => lunchTx[`${id}|${d}|${c}`]), chain("counter", ref)) < -8, "chain walk-in down");
    assert.ok(pct(chain("delivery", (id, c) => lunchTx[`${id}|${d}|${c}`]), chain("delivery", ref)) > 10, "chain delivery up");
    assert.equal(weather.find((w) => w.date === d).condition, "heavy rain");
  }
  assert.equal(weather.filter((w) => w.condition === "heavy rain").length, 2, "no other heavy-rain days");
});

test("one bad day is not an anomaly: Store 12's power cut halves one lunch, store stays in range", () => {
  const s = sales["12"];
  const day = s.find((p) => p.date === "2026-11-05").sales;
  const typical = median(s.filter((p) => inRecent(p.date) && p.date !== "2026-11-05").map((p) => p.sales));
  assert.ok(day < 0.5 * typical, `outage day ${day} vs typical ${typical}`);
  assert.equal(anomaly(s).flagged, false);
  assert.ok(quality.some((q) => q.store === "12" && q.date === "2026-11-05"));
});

test("data quality: Store 27's POS gap is zeros in the table and documented", () => {
  const gap = rows.filter((r) => r.store === "27" && r.date === "2026-09-29" && r.daypart === "breakfast");
  assert.ok(gap.length > 0 && gap.every((r) => r.tx === 0 && r.net === 0));
  assert.ok(quality.some((q) => q.store === "27" && q.issue === "pos_outage"));
});

test("study-results and judges keep the StudyResults shape", () => {
  const check = (r) => {
    assert.deepEqual(Object.keys(r).sort(), ["options", "question", "real", "sampleSize", "synthetic"]);
    assert.equal(r.options.length, 3);
    assert.equal(r.real.length, 3);
    assert.equal(r.synthetic.length, 3);
    assert.ok(Number.isInteger(r.sampleSize) && r.sampleSize >= 0);
  };
  check(load("study-results.json")["14"]);
  check(load("judges.json"));
});

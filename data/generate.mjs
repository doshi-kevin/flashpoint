// Deterministic generator for the SYNTHETIC demo world: a fictional 40-unit quick-service burger
// franchise group (5 districts x 8 stores), modelled on public McDonald's-style US benchmarks.
// Same seed -> byte-identical files, every run:   node data/generate.mjs
//
// Writes (all SYNTHETIC unless noted):
//   pos/daily_daypart_channel.csv  POS-style fact table: date x store x daypart x channel
//   sales.json / traffic.json      Weekday lunch roll-ups the app reads (shapes frozen in lib/types.ts)
//   stores.json                    Store list (shape frozen) ; store-profiles.json  format, district, comparisons
//   weather.json (CACHED)          City weather by daypart ; calendar.json (CACHED)  holidays, promos, local shocks
//   events.json (CACHED)           Chart markers per store ; data-quality.json      known POS issues
// Benchmarks and assumptions are listed in data/README.md.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SEED = 20261114;
const START = "2026-08-17"; // Monday
const END = "2026-11-13"; // Friday (data through yesterday; today is Sat 14 Nov 2026)
const CHAIN = "Crumb & Crust";

export const DAYPARTS = ["breakfast", "lunch", "afternoon", "dinner", "late_night"];
export const DAYPART_HOURS = {
  breakfast: "05:00-10:30",
  lunch: "10:30-14:00",
  afternoon: "14:00-17:00",
  dinner: "17:00-20:00",
  late_night: "20:00-close",
};
export const CHANNELS = ["drive_thru", "counter", "mobile_pickup", "delivery"];

// ---- Store formats --------------------------------------------------------------------------
// auv: median annual sales ($). ticket: target average check ($). Shares are of transactions.
const FORMATS = {
  drive_thru: {
    label: "Freestanding with drive-thru",
    auv: 4_100_000, ticket: 11.4, hours: "05:00-24:00", seats: 60,
    daypart: { breakfast: 0.23, lunch: 0.3, afternoon: 0.15, dinner: 0.21, late_night: 0.11 },
    channel: { drive_thru: 0.66, counter: 0.18, mobile_pickup: 0.08, delivery: 0.08 },
    dow: [1.02, 0.94, 0.95, 0.97, 1.0, 1.1, 1.12], // Sun..Sat
  },
  inline: {
    label: "Urban in-line (no drive-thru)",
    auv: 2_700_000, ticket: 10.2, hours: "06:00-22:00", seats: 40,
    daypart: { breakfast: 0.28, lunch: 0.36, afternoon: 0.15, dinner: 0.15, late_night: 0.06 },
    channel: { drive_thru: 0, counter: 0.6, mobile_pickup: 0.2, delivery: 0.2 },
    dow: [0.58, 1.0, 1.03, 1.04, 1.03, 1.02, 0.7],
  },
  campus: {
    label: "Campus-adjacent in-line",
    auv: 2_300_000, ticket: 9.4, hours: "07:00-24:00", seats: 70,
    daypart: { breakfast: 0.12, lunch: 0.38, afternoon: 0.2, dinner: 0.2, late_night: 0.1 },
    channel: { drive_thru: 0, counter: 0.62, mobile_pickup: 0.24, delivery: 0.14 },
    dow: [0.66, 1.04, 1.06, 1.06, 1.02, 0.92, 0.62],
  },
  travel: {
    label: "Highway travel plaza",
    auv: 4_900_000, ticket: 12.1, hours: "24h", seats: 90,
    daypart: { breakfast: 0.22, lunch: 0.27, afternoon: 0.16, dinner: 0.21, late_night: 0.14 },
    channel: { drive_thru: 0.48, counter: 0.4, mobile_pickup: 0.08, delivery: 0.04 },
    dow: [1.12, 0.92, 0.9, 0.92, 0.98, 1.15, 1.18],
  },
  in_store: {
    label: "In-store (supercenter)",
    auv: 1_500_000, ticket: 9.2, hours: "07:00-21:00", seats: 30,
    daypart: { breakfast: 0.15, lunch: 0.4, afternoon: 0.22, dinner: 0.2, late_night: 0.03 },
    channel: { drive_thru: 0, counter: 0.84, mobile_pickup: 0.12, delivery: 0.04 },
    dow: [1.12, 0.88, 0.86, 0.9, 0.95, 1.08, 1.25],
  },
};
// Channel mix shifts by daypart (added, then renormalised over the channels a format has).
const CHANNEL_SHIFT = {
  breakfast: { drive_thru: 0.06, counter: -0.03, delivery: -0.03 },
  lunch: { drive_thru: -0.04, counter: 0.03, mobile_pickup: 0.01 },
  afternoon: {},
  dinner: { counter: -0.02, delivery: 0.02 },
  late_night: { drive_thru: 0.08, counter: -0.1, delivery: 0.02 },
};
const DAYPART_TICKET = { breakfast: 0.8, lunch: 1.04, afternoon: 0.78, dinner: 1.18, late_night: 1.02 };
const CHANNEL_TICKET = { drive_thru: 1.0, counter: 0.93, mobile_pickup: 1.07, delivery: 1.62 }; // delivery: bigger orders + menu markup
const DT_SERVICE_SEC = { breakfast: 290, lunch: 315, afternoon: 270, dinner: 330, late_night: 300 };

// ---- Stores ---------------------------------------------------------------------------------
// [id, area, district, format]. Stores 11, 12, 14, 17, 21 keep their original areas.
const STORE_ROWS = [
  [1, "Bayview Ave", "North Shore", "drive_thru"], [2, "North Shore Mall", "North Shore", "inline"],
  [3, "Pine Ridge", "North Shore", "drive_thru"], [4, "Lakeside Dr", "North Shore", "drive_thru"],
  [5, "Maple Heights", "North Shore", "drive_thru"], [6, "Cedar Point", "North Shore", "drive_thru"],
  [7, "Willow Creek", "North Shore", "drive_thru"], [8, "Route 9 Travel Plaza", "North Shore", "travel"],
  [9, "Seawall Blvd", "Harbor", "drive_thru"], [10, "Marina Blvd", "Harbor", "drive_thru"],
  [11, "Old Town", "Harbor", "inline"], [12, "University District", "Harbor", "campus"],
  [13, "Pier Station", "Harbor", "inline"], [14, "Harbor Street", "Harbor", "drive_thru"],
  [15, "Lighthouse Sq", "Harbor", "drive_thru"], [16, "Wharf Lane", "Harbor", "drive_thru"],
  [17, "Central Station", "Central", "inline"], [18, "Market Square", "Central", "inline"],
  [19, "City Hall Plaza", "Central", "inline"], [20, "Civic Center", "Central", "drive_thru"],
  [21, "Riverside Park", "Central", "drive_thru"], [22, "Elm & 5th", "Central", "drive_thru"],
  [23, "Union Ave", "Central", "drive_thru"], [24, "Arts District", "Central", "inline"],
  [25, "Westgate Commons", "Westgate", "drive_thru"], [26, "Sunset Ridge", "Westgate", "drive_thru"],
  [27, "Hillcrest", "Westgate", "drive_thru"], [28, "Oak Valley", "Westgate", "drive_thru"],
  [29, "Westgate SuperMart", "Westgate", "in_store"], [30, "Meadowbrook", "Westgate", "drive_thru"],
  [31, "Route 9 West", "Westgate", "travel"], [32, "Fairview", "Westgate", "drive_thru"],
  [33, "Eastfield Industrial Park", "Eastfield", "drive_thru"], [34, "Foundry Rd", "Eastfield", "drive_thru"],
  [35, "Rail Yard", "Eastfield", "drive_thru"], [36, "Eastfield Center", "Eastfield", "drive_thru"],
  [37, "Mill St", "Eastfield", "inline"], [38, "Canal St", "Eastfield", "drive_thru"],
  [39, "Ironworks Ave", "Eastfield", "drive_thru"], [40, "Eastfield Plaza", "Eastfield", "drive_thru"],
];
// Pre-registered comparison stores for the investigated store: same district and format,
// not exposed to the roadworks or the rival deal (15 is next to the rival, so it's excluded).
const COMPARISONS = { "14": ["9", "10", "16", "20"] };

// ---- Story and calendar (dates are the planted tells; see data/README.md) -------------------
const ROADWORKS_START = "2026-10-26"; // Harbor St lane closure 10:00-15:00, weekdays and weekends
const RIVAL_START = "2026-11-02"; // rival $5 lunch deal on Dock Rd, near stores 14 and 15
const HEAVY_RAIN = ["2026-11-03", "2026-11-10"];
const LAYOFF_EFFECTIVE = "2026-10-19"; // Eastfield Components layoffs (announced 5 Oct, effective Fri 16 Oct)
const OUTAGE = { store: "12", date: "2026-11-05" }; // power cut 11:40-13:10: one bad day, not an anomaly
const POS_GAP = { store: "27", date: "2026-09-29", daypart: "breakfast" }; // POS outage: sales not recorded

export const CALENDAR = [
  { start: "2026-08-31", scope: "store:12", type: "school", label: "University classes start (campus traffic returns)" },
  { start: "2026-09-07", scope: "chain", type: "holiday", label: "Labor Day (commuter stores quiet, highway busy)" },
  { start: "2026-09-08", scope: "city", type: "school", label: "Public schools start (weekday breakfast and after-school lift)" },
  { start: "2026-09-21", end: "2026-10-18", scope: "chain", type: "promotion", label: "National LTO \"Harvest Stack\" (lunch and dinner)" },
  { start: "2026-10-05", scope: "chain", type: "price", label: "Menu price increase (about +2.2% average check)" },
  { start: "2026-10-05", scope: "district:Eastfield", type: "economy", label: "Eastfield Components announces ~400 layoffs, effective 16 Oct" },
  { start: "2026-10-12", scope: "city", type: "holiday", label: "Indigenous Peoples' Day (downtown offices partly closed)" },
  { start: ROADWORKS_START, end: "2026-11-20", scope: "store:14", type: "roadworks", label: "Harbor St resurfacing, one lane closed 10:00-15:00" },
  { start: "2026-10-31", scope: "city", type: "holiday", label: "Halloween (Saturday; dinner and late night dip)" },
  { start: "2026-11-01", scope: "city", type: "clock", label: "Daylight saving time ends (darker evenings)" },
  { start: RIVAL_START, scope: "store:14,15", type: "competitor", label: "Rival on Dock Rd launches $5 lunch deal" },
  { start: HEAVY_RAIN[0], scope: "city", type: "weather", label: "Heavy rain all day" },
  { start: OUTAGE.date, scope: "store:12", type: "outage", label: "Power cut on University Ave, 11:40-13:10" },
  { start: HEAVY_RAIN[1], scope: "city", type: "weather", label: "Heavy rain all day" },
  { start: "2026-11-11", scope: "city", type: "holiday", label: "Veterans Day (some downtown offices closed)" },
];

// ---- Helpers --------------------------------------------------------------------------------
function rng(seed) {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const round2 = (x) => Math.round(x * 100) / 100;
const inRange = (d, a, b) => d >= a && d <= b;

function allDays(start, end) {
  const out = [];
  for (let d = new Date(start + "T00:00:00Z"); d <= new Date(end + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1))
    out.push({ date: d.toISOString().slice(0, 10), dow: d.getUTCDay(), dom: d.getUTCDate() });
  return out;
}

function channelShares(fmt, dp) {
  const base = FORMATS[fmt].channel;
  const raw = {};
  for (const c of CHANNELS) raw[c] = base[c] > 0 ? Math.max(0.01, base[c] + (CHANNEL_SHIFT[dp][c] ?? 0)) : 0;
  const tot = CHANNELS.reduce((t, c) => t + raw[c], 0);
  for (const c of CHANNELS) raw[c] /= tot;
  return raw;
}

// Average of daypart x channel ticket multipliers, weighted by transactions: used so a store's
// overall average check lands on its target.
function ticketNorm(fmt) {
  let w = 0;
  for (const dp of DAYPARTS) {
    const sh = channelShares(fmt, dp);
    for (const c of CHANNELS) w += FORMATS[fmt].daypart[dp] * sh[c] * DAYPART_TICKET[dp] * CHANNEL_TICKET[c];
  }
  return w;
}

// ---- Weather (city-wide, CACHED fixture) ----------------------------------------------------
function makeWeather(days) {
  const rand = rng(SEED);
  let anomaly = 0;
  return days.map(({ date }, i) => {
    anomaly = 0.7 * anomaly + normal(rand) * 3;
    const high = Math.round(85 - (31 * i) / (days.length - 1) + anomaly);
    const low = Math.round(high - 13 + normal(rand) * 2);
    const rain = { morning: 0, midday: 0, evening: 0 };
    if (HEAVY_RAIN.includes(date)) Object.assign(rain, { morning: 0.6, midday: 1, evening: 0.9 });
    else if (rand() < 0.2)
      for (const k of Object.keys(rain)) if (rand() < 0.55) rain[k] = round2(0.15 + rand() * 0.3);
    const peak = Math.max(rain.morning, rain.midday, rain.evening);
    const condition = peak >= 0.8 ? "heavy rain" : peak >= 0.3 ? "rain" : peak > 0 ? "light rain" : rand() < 0.35 ? "cloudy" : "clear";
    const precip_in = round2((rain.morning + rain.midday + rain.evening) * 0.35);
    return { date, high_f: high, low_f: low, precip_in, condition, rain };
  });
}
const RAIN_PART = { breakfast: "morning", lunch: "midday", afternoon: "midday", dinner: "evening", late_night: "evening" };
const RAIN_EFFECT = { drive_thru: -0.05, counter: -0.16, mobile_pickup: -0.07, delivery: 0.22 }; // per unit intensity

// ---- Effects --------------------------------------------------------------------------------
/** Multipliers on [transactions, ticket] for one store, day, daypart and channel. */
function effects(store, day, dp, ch, wx) {
  const { date, dow, dom } = day;
  const fmt = store.format;
  const weekday = dow >= 1 && dow <= 5;
  let tx = 1;
  let tk = 1;

  // Calendar
  if (store.format === "campus" && date < "2026-08-31") tx *= 0.55; // summer break
  if (date >= "2026-09-08" && weekday && (fmt === "drive_thru" || fmt === "in_store")) {
    if (dp === "breakfast") tx *= 1.05;
    if (dp === "afternoon") tx *= 1.06;
  }
  if (date === "2026-09-07") {
    tx *= fmt === "inline" ? 0.45 : fmt === "campus" ? 0.6 : fmt === "travel" ? 1.2 : dp === "breakfast" ? 0.85 : 1.06;
  }
  if (date === "2026-09-04" && fmt === "travel") tx *= 1.1;
  if ((date === "2026-10-12" || date === "2026-11-11") && fmt === "inline" && (dp === "breakfast" || dp === "lunch")) tx *= 0.87;
  if (date === "2026-10-31") tx *= dp === "dinner" ? 0.86 : dp === "late_night" ? 0.88 : dp === "afternoon" ? 1.06 : 1;
  if (date >= "2026-11-01" && (dp === "dinner" || dp === "late_night")) tx *= ch === "delivery" ? 1.04 : 0.97;
  if (inRange(date, "2026-09-21", "2026-10-18") && (dp === "lunch" || dp === "dinner")) {
    tx *= 1.015;
    tk *= 1.01;
  }
  if (date >= "2026-10-05") {
    tk *= 1.022;
    tx *= 0.995;
  }
  if (dom === 1 || dom === 2 || dom === 15 || dom === 16) tx *= 1.025; // paydays
  if (dom >= 26) tx *= 0.985; // end-of-month squeeze
  if (dow === 0 || dow === 6) {
    if (dp === "breakfast" && fmt === "drive_thru") tx *= 1.08;
  }
  if ((dow === 5 || dow === 6) && dp === "late_night") tx *= 1.1;

  // Weather
  const intensity = wx.rain[RAIN_PART[dp]];
  if (intensity) tx *= 1 + RAIN_EFFECT[ch] * intensity;
  if (wx.high_f >= 88 && dp === "afternoon") tx *= 1.05;
  if (wx.high_f < 50 && ch === "delivery") tx *= 1.05;

  // Story: Store 14 roadworks (lane closed 10:00-15:00 -> drive-thru queue spills onto the street)
  if (store.id === "14" && date >= ROADWORKS_START) {
    const ramp = date === ROADWORKS_START ? 0.7 : 1;
    const hit = {
      lunch: { drive_thru: 0.17, counter: 0.12, mobile_pickup: 0.06, delivery: 0.02 },
      afternoon: { drive_thru: 0.08, counter: 0.06, mobile_pickup: 0.03, delivery: 0 },
      breakfast: { drive_thru: 0.03, counter: 0.02, mobile_pickup: 0, delivery: 0 },
    }[dp];
    if (hit) tx *= 1 - hit[ch] * ramp;
  }
  // Rival $5 lunch deal: a small, real effect that starts a week AFTER Store 14's drop began
  if ((store.id === "14" || store.id === "15") && date >= RIVAL_START && dp === "lunch" && ch !== "drive_thru") tx *= 0.97;
  // Eastfield layoffs: a district-wide local-economy signal (all 8 stores, trade-down in ticket)
  if (store.district === "Eastfield" && date >= LAYOFF_EFFECTIVE) {
    tx *= { breakfast: 0.94, lunch: 0.975, afternoon: 0.98, dinner: 0.98, late_night: 0.99 }[dp];
    tk *= 0.985;
  }
  // Store 12 power cut: one bad lunch
  if (store.id === OUTAGE.store && date === OUTAGE.date && dp === "lunch")
    tx *= ch === "mobile_pickup" || ch === "delivery" ? 0.3 : 0.45;

  return [tx, tk];
}

function dtServiceSec(store, date, dp, wx, rand) {
  let s = store.dtBase * (DT_SERVICE_SEC[dp] / DT_SERVICE_SEC.lunch) + normal(rand) * 12;
  if (wx.rain[RAIN_PART[dp]] >= 0.8) s += 15;
  if (store.id === "14" && date >= ROADWORKS_START) s += dp === "lunch" ? 140 : dp === "afternoon" ? 45 : 0;
  return Math.round(s);
}

// ---- Generate -------------------------------------------------------------------------------
export function generate() {
  const days = allDays(START, END);
  const weather = makeWeather(days);
  const wxByDate = Object.fromEntries(weather.map((w) => [w.date, w]));

  const stores = STORE_ROWS.map(([n, area, district, format]) => {
    const id = String(n);
    const rand = rng(SEED + n * 7919);
    return {
      id, area, district, format, rand,
      auv: FORMATS[format].auv * Math.exp(normal(rand) * 0.16),
      ticket: FORMATS[format].ticket * Math.exp(normal(rand) * 0.04),
      dtBase: 315 + normal(rand) * 18,
      drift: id === "14" || id === "12" ? 0 : normal(rand) * 0.007, // store trend; 14 and 12 are the reference stores, kept trend-free
      tNorm: ticketNorm(format),
      dowNorm: FORMATS[format].dow.reduce((t, x) => t + x, 0) / 7,
    };
  });

  const csv = ["date,store_id,daypart,channel,transactions,net_sales,avg_dt_service_sec"];
  const sales = {};
  const traffic = {};
  for (const st of stores) {
    const { rand } = st;
    const F = FORMATS[st.format];
    const dailyTx = st.auv / 365 / st.ticket;
    let week = 0;
    sales[st.id] = [];
    traffic[st.id] = [];
    days.forEach((day, i) => {
      if (day.dow === 1) week = 0.6 * week + normal(rand) * 0.012; // weekly AR(1) store shock
      const dayShock = Math.exp(week + normal(rand) * 0.03);
      const season = 1.01 - (0.02 * i) / (days.length - 1);
      const trend = 1 + st.drift * (i / (days.length - 1));
      const wx = wxByDate[day.date];
      let lunchTx = 0;
      let lunchSales = 0;
      for (const dp of DAYPARTS) {
        const sh = channelShares(st.format, dp);
        for (const ch of CHANNELS) {
          if (!sh[ch]) continue;
          const [ex, et] = effects(st, day, dp, ch, wx);
          const lambda = dailyTx * (F.dow[day.dow] / st.dowNorm) * F.daypart[dp] * sh[ch] * season * trend * dayShock * ex;
          let tx = Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal(rand)));
          const ticket = (st.ticket * DAYPART_TICKET[dp] * CHANNEL_TICKET[ch] * et * Math.exp(normal(rand) * 0.02)) / st.tNorm;
          if (st.id === POS_GAP.store && day.date === POS_GAP.date && dp === POS_GAP.daypart) tx = 0; // not recorded
          const net = round2(tx * ticket);
          const svc = ch === "drive_thru" && tx > 0 ? dtServiceSec(st, day.date, dp, wx, rand) : "";
          csv.push(`${day.date},${st.id},${dp},${ch},${tx},${net.toFixed(2)},${svc}`);
          if (dp === "lunch") {
            lunchTx += tx;
            lunchSales += net;
          }
        }
      }
      if (day.dow >= 1 && day.dow <= 5) {
        const s = round2(lunchSales);
        sales[st.id].push({ date: day.date, sales: s });
        traffic[st.id].push({ date: day.date, visits: lunchTx, avgTicket: lunchTx ? round2(s / lunchTx) : 0 });
      }
    });
  }

  const storeList = stores.map((s) => ({ id: s.id, name: `Store ${s.id}`, chain: CHAIN, area: s.area }));
  const profiles = Object.fromEntries(
    stores.map((s) => [
      s.id,
      {
        district: s.district,
        format: s.format,
        formatLabel: FORMATS[s.format].label,
        hasDriveThru: FORMATS[s.format].channel.drive_thru > 0,
        hours: FORMATS[s.format].hours,
        seats: FORMATS[s.format].seats,
        comparisonStores:
          COMPARISONS[s.id] ??
          stores.filter((o) => o.id !== s.id && o.district === s.district && o.format === s.format).map((o) => o.id),
      },
    ]),
  );

  const events = {};
  for (const s of stores) {
    const list = HEAVY_RAIN.map((date) => ({ date, type: "rain", label: "Heavy rain (city-wide)" }));
    if (s.id === "14") list.push({ date: ROADWORKS_START, type: "roadworks", label: "Roadworks begin on Harbor St (one lane closed 10:00-15:00)" });
    if (s.id === "14" || s.id === "15") list.push({ date: RIVAL_START, type: "competitor", label: "Rival on Dock Rd launches $5 lunch deal" });
    events[s.id] = list.sort((a, b) => a.date.localeCompare(b.date));
  }

  const dataQuality = [
    { store: POS_GAP.store, date: POS_GAP.date, daypart: POS_GAP.daypart, issue: "pos_outage", detail: "Breakfast transactions not recorded (rows are 0); sales did happen. Exclude from baselines." },
    { store: OUTAGE.store, date: OUTAGE.date, daypart: "lunch", issue: "power_outage", detail: "Power cut 11:40-13:10. Real lost sales, one day only." },
  ];

  return {
    csv: csv.join("\n") + "\n",
    sales,
    traffic,
    stores: storeList,
    profiles,
    weather,
    calendar: CALENDAR,
    events,
    dataQuality,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = generate();
  const dir = new URL(".", import.meta.url);
  const json = (name, v) => writeFileSync(new URL(name, dir), JSON.stringify(v, null, name.match(/sales|traffic|weather/) ? 0 : 2) + "\n");
  mkdirSync(new URL("pos/", dir), { recursive: true });
  writeFileSync(new URL("pos/daily_daypart_channel.csv", dir), out.csv);
  json("sales.json", out.sales);
  json("traffic.json", out.traffic);
  json("stores.json", out.stores);
  json("store-profiles.json", out.profiles);
  json("weather.json", out.weather);
  json("calendar.json", out.calendar);
  json("events.json", out.events);
  json("data-quality.json", out.dataQuality);
  console.log(`wrote ${out.stores.length} stores, ${out.csv.split("\n").length - 2} POS rows, ${out.sales["14"].length} weekdays`);
}

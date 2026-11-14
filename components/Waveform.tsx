// "The sales waveform": a smooth custom SVG curve of daily sales (5-day average for the shape),
// a dashed guide at the level before the first event, and numbered event nodes with cards beneath.
// Props: data (SalesPoint[]), events (StoreEvent[]). Shape only: every number shown elsewhere comes from lib/metrics.
import type { SalesPoint, StoreEvent } from "@/lib/types";

const W = 1000;
const TOP = 40;
const BOTTOM = 220;
const PAD = 24;

const eventStyle = {
  rain: { color: "#6f8a85", glyph: "◌", label: "Weather" },
  roadworks: { color: "#8a5a0b", glyph: "▲", label: "Roadworks" },
  competitor: { color: "#a3313f", glyph: "◆", label: "Competitor" },
};

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function smooth(values: number[], k = 2) {
  return values.map((_, i) => {
    const a = Math.max(0, i - k);
    const b = Math.min(values.length - 1, i + k);
    let s = 0;
    for (let j = a; j <= b; j++) s += values[j];
    return s / (b - a + 1);
  });
}

// Catmull-Rom spline through the points, as cubic Beziers.
function curve(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export default function Waveform({ data, events }: { data: SalesPoint[]; events: StoreEvent[] }) {
  if (data.length < 2) return null;
  const ys = smooth(data.map((d) => d.sales));
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (data.length - 1);
  const y = (v: number) => TOP + ((max - v) / span) * (BOTTOM - TOP);
  const pts = ys.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = curve(pts);
  const area = `${line} L ${x(data.length - 1).toFixed(1)},260 L ${x(0).toFixed(1)},260 Z`;

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const firstIdx = sorted.length ? data.findIndex((d) => d.date >= sorted[0].date) : -1;
  const before = ys.slice(0, firstIdx > 0 ? firstIdx : Math.floor(ys.length / 2));
  const prior = before.reduce((a, b) => a + b, 0) / (before.length || 1);
  const nodes = sorted
    .map((e, n) => {
      const i = data.findIndex((d) => d.date >= e.date);
      return i < 0 ? null : { e, n: n + 1, cx: x(i), cy: y(ys[i]) };
    })
    .filter(Boolean) as { e: StoreEvent; n: number; cx: number; cy: number }[];

  return (
    <div>
      <figure>
        <figcaption className="sr-only">
          Daily weekday lunch sales from {fmt(data[0].date)} to {fmt(data[data.length - 1].date)}, with {nodes.length} dated events marked.
        </figcaption>
        <svg viewBox={`0 0 ${W} 280`} className="h-auto w-full overflow-visible" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="wave-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#a3313f" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#d9f06b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#a3313f" stopOpacity="0" />
            </linearGradient>
            <filter id="wave-shadow" x="-5%" y="-20%" width="110%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#a3313f" floodOpacity="0.3" />
            </filter>
          </defs>
          <line x1={PAD} x2={W - PAD} y1={y(prior)} y2={y(prior)} stroke="#d3c8b3" strokeWidth="2" strokeDasharray="6 6" />
          <path d={area} fill="url(#wave-fill)" />
          <path d={line} fill="none" stroke="#a3313f" strokeWidth="3.5" strokeLinecap="round" filter="url(#wave-shadow)" />
          {nodes.map(({ e, n, cx, cy }) => (
            <g key={e.date + e.type}>
              <line x1={cx} x2={cx} y1={cy} y2={252} stroke={eventStyle[e.type].color} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
              <circle cx={cx} cy={cy} r="11" fill="#fffdf8" stroke={eventStyle[e.type].color} strokeWidth="2.5" />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1b18" fontFamily="var(--font-dmmono), monospace">
                {n}
              </text>
            </g>
          ))}
          <text x={PAD} y={276} fontSize="13" fill="#6e685c" fontFamily="var(--font-dmmono), monospace">
            {fmt(data[0].date)}
          </text>
          <text x={W - PAD} y={276} textAnchor="end" fontSize="13" fill="#6e685c" fontFamily="var(--font-dmmono), monospace">
            {fmt(data[data.length - 1].date)}
          </text>
        </svg>
      </figure>

      {nodes.length > 0 && (
        <ol className="mt-5 grid gap-3 border-t border-line/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {nodes.map(({ e, n }) => {
            const st = eventStyle[e.type];
            return (
              <li key={e.date + e.type} className="glass sculpt-sm space-y-1.5 p-3.5">
                <div className="flex items-center gap-2 font-mono text-xs font-medium">
                  <span className="grid h-5 w-5 place-items-center rounded-full border-2 bg-card text-[11px]" style={{ borderColor: st.color }}>
                    {n}
                  </span>
                  <span className="text-muted">{fmt(e.date).toUpperCase()}</span>
                  <span className="ml-auto" style={{ color: st.color }}>
                    <span aria-hidden>{st.glyph}</span> {st.label}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-snug">{e.label}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

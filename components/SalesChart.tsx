"use client";
// Sales line chart with event markers (rain / roadworks / competitor). Markers use a glyph plus a text legend.
// Props: data (SalesPoint[]), events (StoreEvent[]).
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SalesPoint, StoreEvent } from "@/lib/types";

const eventStyle = {
  rain: { color: "#6f8a85", mark: "◌", label: "Rain" },
  roadworks: { color: "#8a5a0b", mark: "▲", label: "Roadworks" },
  competitor: { color: "#a3313f", mark: "◆", label: "Competitor" },
};

const tick = { fontSize: 11, fill: "#6b6558", fontFamily: "var(--font-dmmono)" };

export default function SalesChart({ data, events }: { data: SalesPoint[]; events: StoreEvent[] }) {
  return (
    <figure>
      <figcaption className="sr-only">Daily weekday lunch sales with dated events marked on the line.</figcaption>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#e2daca" vertical={false} />
            <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={{ stroke: "#cfc5b1" }} minTickGap={36} />
            <YAxis domain={["auto", "auto"]} tick={tick} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              contentStyle={{ background: "#1c1b18", border: "none", borderRadius: 6, color: "#f3eee2", fontSize: 12 }}
              labelStyle={{ color: "#d9f06a", fontFamily: "var(--font-dmmono)" }}
              itemStyle={{ color: "#f3eee2" }}
              cursor={{ stroke: "#cfc5b1" }}
            />
            {events.map((e) => (
              <ReferenceLine key={e.date + e.type} x={e.date} stroke={eventStyle[e.type].color} strokeWidth={1.5} strokeDasharray="4 3" />
            ))}
            <Line type="monotone" dataKey="sales" stroke="#1c1b18" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#d9f06a", stroke: "#1c1b18" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {events.map((e) => (
          <li key={e.date + e.type} className="flex items-center gap-1.5">
            <span aria-hidden style={{ color: eventStyle[e.type].color }}>
              {eventStyle[e.type].mark}
            </span>
            <span className="font-mono text-muted">{e.date}</span>
            <span className="text-ink-2">{e.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

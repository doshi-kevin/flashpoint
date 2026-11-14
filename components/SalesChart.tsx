"use client";
// Sales line chart with event markers (rain / roadworks / competitor).
// Props: data (SalesPoint[]), events (StoreEvent[]).
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { SalesPoint, StoreEvent } from "@/lib/types";

const eventColor = { rain: "#2563eb", roadworks: "#b45309", competitor: "#c2370b" };

export default function SalesChart({ data, events }: { data: SalesPoint[]; events: StoreEvent[] }) {
  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6a665c" }} stroke="#e4e0d6" minTickGap={30} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#6a665c" }} stroke="#e4e0d6" width={40} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#121110" strokeWidth={2} dot={false} />
            {events.map((e) => (
              <ReferenceLine key={e.date + e.type} x={e.date} stroke={eventColor[e.type]} strokeDasharray="4 2" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {events.map((e) => (
          <li key={e.date + e.type} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: eventColor[e.type] }} />
            {e.date}: {e.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";
// Sales line chart with event markers (rain / roadworks / competitor).
// Props: data (SalesPoint[]), events (StoreEvent[]).
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { SalesPoint, StoreEvent } from "@/lib/types";

const eventColor = { rain: "#3b82f6", roadworks: "#f59e0b", competitor: "#ef4444" };

export default function SalesChart({ data, events }: { data: SalesPoint[]; events: StoreEvent[] }) {
  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#111827" dot={false} />
            {events.map((e) => (
              <ReferenceLine key={e.date + e.type} x={e.date} stroke={eventColor[e.type]} strokeDasharray="4 2" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
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

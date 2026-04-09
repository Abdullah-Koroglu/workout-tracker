"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProgressChart({
  data,
  dataKey,
  color = "#0ea5e9"
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color?: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

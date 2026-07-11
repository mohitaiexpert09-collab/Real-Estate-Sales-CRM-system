"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";

const SOURCE_COLORS: Record<string, string> = {
  "99acres": "#ef4444",
  MagicBricks: "#f97316",
  Housing: "#0ea5e9",
  Facebook: "#3b82f6",
  Website: "#8b5cf6",
  WhatsApp: "#10b981",
};

export function SourceBarChart({ data }: { data: { source: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#eef1f6" />
        <XAxis dataKey="source" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
          contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(0,0,0,.25)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={46}>
          {data.map((d) => (
            <Cell key={d.source} fill={SOURCE_COLORS[d.source] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResponseTrendChart({ data }: { data: { day: string; secs: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#eef1f6" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="s" width={40} />
        <Tooltip
          formatter={(v: number) => [`${v}s`, "Avg response"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="secs" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

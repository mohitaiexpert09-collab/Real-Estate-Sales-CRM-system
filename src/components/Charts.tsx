"use client";

import { useEffect, useState } from "react";
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

// Monochrome ramps — dark→light on a light canvas, light→dark on a dark canvas,
// so every bar stays legible in whichever theme is active.
const RAMP_LIGHT = ["#18181b", "#3f3f46", "#52525b", "#71717a", "#a1a1aa", "#d4d4d8"];
const RAMP_DARK = ["#fafafa", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

function useThemeTokens() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return {
    ramp: dark ? RAMP_DARK : RAMP_LIGHT,
    line: dark ? "#f4f4f5" : "#18181b",
    grid: dark ? "#27272a" : "#e4e4e7",
    axis: dark ? "#a1a1aa" : "#71717a",
    tooltipBg: dark ? "#18181b" : "#ffffff",
    tooltipBorder: dark ? "#3f3f46" : "#e4e4e7",
    tooltipText: dark ? "#f4f4f5" : "#18181b",
  };
}

export function SourceBarChart({ data }: { data: { source: string; count: number }[] }) {
  const t = useThemeTokens();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={t.grid} />
        <XAxis dataKey="source" tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: t.grid, fillOpacity: 0.4 }}
          contentStyle={{
            borderRadius: 10,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
            color: t.tooltipText,
            fontSize: 12,
            boxShadow: "0 8px 24px -12px rgba(0,0,0,.35)",
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={46}>
          {data.map((d, i) => (
            <Cell key={d.source} fill={t.ramp[i % t.ramp.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResponseTrendChart({ data }: { data: { day: string; secs: number }[] }) {
  const t = useThemeTokens();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={t.grid} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} unit="s" width={40} />
        <Tooltip
          formatter={(v: number) => [`${v}s`, "Avg response"]}
          contentStyle={{
            borderRadius: 10,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
            color: t.tooltipText,
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="secs" stroke={t.line} strokeWidth={2.5} dot={{ r: 3, fill: t.line }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

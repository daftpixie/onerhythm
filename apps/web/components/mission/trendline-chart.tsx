"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendlineChartProps = {
  title: string;
  data: { label: string; value: number }[];
  color: string;
  caption: string;
  type?: "area" | "bar";
};

function ChartTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-token bg-cosmos px-3 py-2 text-xs shadow-panel">
      <p className="font-mono font-bold" style={{ color }}>
        {label}
      </p>
      <p className="mt-0.5 text-text-secondary">{payload[0].value}%</p>
    </div>
  );
}

export function TrendlineChart({
  title,
  data,
  color,
  caption,
  type = "area",
}: TrendlineChartProps) {
  return (
    <div className="rounded-xl border border-token bg-cosmos p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary">
        {title}
      </h3>
      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id={`fill-${color.replace("#", "")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
                unit="%"
              />
              <Tooltip
                content={
                  <ChartTooltip color={color} />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${color.replace("#", "")})`}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: "var(--color-cosmos)" }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
                unit="%"
              />
              <Tooltip
                content={
                  <ChartTooltip color={color} />
                }
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="mt-3 font-mono text-[10px] leading-4 text-text-tertiary">
        {caption}
      </p>
    </div>
  );
}

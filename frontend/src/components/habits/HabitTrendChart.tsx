"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HabitLogEntry } from "@/types/habit";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Same validated sequential blue as RemainingTrendChart — single series, no
// legend needed. Unlike that chart, the y-axis here starts at 0 on purpose:
// each day is an independent count (a bar), not a running balance (a line),
// and truncating a bar's baseline distorts how its height reads.
const BAR_COLOR = { light: "#2a78d6", dark: "#3987e5" };
const GRID_COLOR = { light: "#e5e5e5", dark: "#3a3a3a" };
const TEXT_COLOR = { light: "#737373", dark: "#a3a3a3" };
const TOOLTIP_BG = { light: "#fcfcfb", dark: "#1a1a19" };
const TOOLTIP_TEXT = { light: "#0b0b0b", dark: "#ffffff" };

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

function TrendTooltip({
  active,
  payload,
  label,
  color,
  isDark,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  color: string;
  isDark: boolean;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs shadow-sm"
      style={{
        background: isDark ? TOOLTIP_BG.dark : TOOLTIP_BG.light,
        color: isDark ? TOOLTIP_TEXT.dark : TOOLTIP_TEXT.light,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-neutral-500">{label ? formatDay(label) : ""}</span>
      <span className="font-semibold tabular-nums">
        {payload[0].value} {unit}
      </span>
    </div>
  );
}

export function HabitTrendChart({
  data,
  unit,
  dailyTarget,
}: {
  data: HabitLogEntry[];
  unit: string;
  dailyTarget: number | null;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  if (data.length === 0) return null;

  const barColor = isDark ? BAR_COLOR.dark : BAR_COLOR.light;
  const textColor = isDark ? TEXT_COLOR.dark : TEXT_COLOR.light;

  return (
    <ResponsiveContainer width="100%" height={224} style={{ touchAction: "pan-y" }}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={isDark ? GRID_COLOR.dark : GRID_COLOR.light} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: textColor, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          content={<TrendTooltip color={barColor} isDark={isDark} unit={unit} />}
          cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
        />
        {/* Dashed here reads as "threshold", which is exactly what this is —
            not a plain gridline, so the dash is meaningful, not decoration. */}
        {dailyTarget != null && (
          <ReferenceLine
            y={dailyTarget}
            stroke={textColor}
            strokeDasharray="4 4"
            label={{ value: "maqsad", position: "insideTopRight", fill: textColor, fontSize: 11 }}
          />
        )}
        <Bar dataKey="amount" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

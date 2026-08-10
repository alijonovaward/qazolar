"use client";

import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RemainingTrendPoint } from "@/hooks/useStats";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Validated sequential blue (dataviz palette, slot 1) — single series, so no legend needed.
const LINE_COLOR = { light: "#2a78d6", dark: "#3987e5" };
const GRID_COLOR = { light: "#e5e5e5", dark: "#3a3a3a" };
const TEXT_COLOR = { light: "#737373", dark: "#a3a3a3" };
const TOOLTIP_BG = { light: "#fcfcfb", dark: "#1a1a19" };
const TOOLTIP_TEXT = { light: "#0b0b0b", dark: "#ffffff" };

function formatBucket(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

// Zoom the Y-axis to the data's actual range instead of always starting at 0 —
// with a large remaining count (e.g. ~1600), a day-to-day change of 10-20 is
// invisible against a 0-1600 scale and the line reads as flat. ~10% padding,
// never below 0 (a remaining count can't be negative).
function paddedDomain([dataMin, dataMax]: readonly [number, number]): [number, number] {
  const range = dataMax - dataMin;
  const padding = Math.max(Math.ceil(range * 0.1), 1);
  return [Math.max(dataMin - padding, 0), dataMax + padding];
}

function TrendTooltip({
  active,
  payload,
  label,
  color,
  isDark,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  color: string;
  isDark: boolean;
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
      <span className="text-neutral-500">{label ? formatBucket(label) : ""}</span>
      <span className="font-semibold tabular-nums">{payload[0].value} ta</span>
    </div>
  );
}

// Always-visible dots on every point (not just on hover) — on a phone/tablet
// there's no cursor to hover with, so the shape of the line has to read on
// its own. The last point (the current value) gets a bigger ring so it's
// obvious which end is "now".
function makePointDot(color: string, ringColor: string, lastIndex: number) {
  return function PointDot(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index == null) return null;
    const isLast = index === lastIndex;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={isLast ? 4 : 2}
        fill={color}
        stroke={isLast ? ringColor : "none"}
        strokeWidth={isLast ? 1.5 : 0}
      />
    );
  };
}

export function RemainingTrendChart({ data }: { data: RemainingTrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-neutral-500">
        Bu davr uchun ma&apos;lumot yo&apos;q
      </p>
    );
  }

  const lineColor = isDark ? LINE_COLOR.dark : LINE_COLOR.light;
  const first = data[0].remaining;
  const last = data[data.length - 1].remaining;
  const delta = last - first;
  // Lower is better (less qazo left) — green for a drop, red for a rise.
  const deltaIsGood = delta <= 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{last}</span>
        <span className="text-sm text-neutral-500">qoldi</span>
        {delta !== 0 && (
          <span
            className={`ml-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              deltaIsGood
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {delta < 0 ? "↓" : "↑"} {Math.abs(delta)}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={224} style={{ touchAction: "pan-y" }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.32} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={isDark ? GRID_COLOR.dark : GRID_COLOR.light} />
          <XAxis
            dataKey="bucket"
            tickFormatter={formatBucket}
            tick={{ fill: isDark ? TEXT_COLOR.dark : TEXT_COLOR.light, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            domain={paddedDomain}
            tick={{ fill: isDark ? TEXT_COLOR.dark : TEXT_COLOR.light, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            content={<TrendTooltip color={lineColor} isDark={isDark} />}
            cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="remaining"
            stroke={lineColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={makePointDot(lineColor, isDark ? "#1a1a19" : "#fcfcfb", data.length - 1)}
            activeDot={{ r: 5, strokeWidth: 2, stroke: isDark ? "#1a1a19" : "#fcfcfb" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

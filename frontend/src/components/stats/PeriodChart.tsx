"use client";

import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { StatsBucket } from "@/hooks/useStats";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Validated sequential blue (dataviz palette, slot 1) — single series, so no legend needed.
const BAR_COLOR = { light: "#2a78d6", dark: "#3987e5" };
const GRID_COLOR = { light: "#e5e5e5", dark: "#3a3a3a" };
const TEXT_COLOR = { light: "#737373", dark: "#a3a3a3" };
const TOOLTIP_BG = { light: "#fcfcfb", dark: "#1a1a19" };
const TOOLTIP_TEXT = { light: "#0b0b0b", dark: "#ffffff" };

function formatBucket(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

function PeriodTooltip({
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

export function PeriodChart({ data }: { data: StatsBucket[] }) {
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

  const barColor = isDark ? BAR_COLOR.dark : BAR_COLOR.light;
  const total = data.reduce((sum, bucket) => sum + bucket.total_completed, 0);
  const average = total / data.length;
  // Per-bar numbers, always visible (not just on hover — there's no cursor
  // on a phone). Only below a bar-count threshold: past that the bars are too
  // narrow for a label to fit without overlapping its neighbors.
  const showLabels = data.length <= 14;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{total}</span>
        <span className="text-sm text-neutral-500">bajarildi</span>
        <span className="ml-auto text-xs text-neutral-500">
          o&apos;rtacha <span className="font-medium tabular-nums">{average.toFixed(1)}</span> / davr
        </span>
      </div>

      <ResponsiveContainer width="100%" height={224} style={{ touchAction: "pan-y" }}>
        <BarChart data={data} margin={{ top: showLabels ? 16 : 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity={1} />
              <stop offset="100%" stopColor={barColor} stopOpacity={0.55} />
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
            tick={{ fill: isDark ? TEXT_COLOR.dark : TEXT_COLOR.light, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            content={<PeriodTooltip color={barColor} isDark={isDark} />}
            cursor={{ fill: isDark ? "#26262633" : "#00000008" }}
          />
          <Bar
            dataKey="total_completed"
            fill={`url(#${gradientId})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            activeBar={{ fillOpacity: 0.8 }}
          >
            {showLabels && (
              <LabelList
                dataKey="total_completed"
                position="top"
                fontSize={11}
                fill={isDark ? TEXT_COLOR.dark : TEXT_COLOR.light}
                formatter={(value) => (value === 0 ? "" : String(value ?? ""))}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

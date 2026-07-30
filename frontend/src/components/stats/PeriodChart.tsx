"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { StatsBucket } from "@/hooks/useStats";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Validated sequential blue (dataviz palette, slot 1) — single series, so no legend needed.
const BAR_COLOR = { light: "#2a78d6", dark: "#3987e5" };
const GRID_COLOR = { light: "#e5e5e5", dark: "#3a3a3a" };
const TEXT_COLOR = { light: "#737373", dark: "#a3a3a3" };

function formatBucket(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

export function PeriodChart({ data }: { data: StatsBucket[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-neutral-500">
        Bu davr uchun ma&apos;lumot yo&apos;q
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke={isDark ? GRID_COLOR.dark : GRID_COLOR.light}
        />
        <XAxis
          dataKey="bucket"
          tickFormatter={formatBucket}
          tick={{ fill: isDark ? TEXT_COLOR.dark : TEXT_COLOR.light, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: isDark ? TEXT_COLOR.dark : TEXT_COLOR.light, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: isDark ? "#26262633" : "#00000008" }}
          contentStyle={{
            background: isDark ? "#1a1a19" : "#fcfcfb",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            color: isDark ? "#ffffff" : "#0b0b0b",
          }}
          labelFormatter={(value) => formatBucket(String(value))}
          formatter={(value) => [`${value} ta`, "Bajarildi"]}
        />
        <Bar
          dataKey="total_completed"
          fill={isDark ? BAR_COLOR.dark : BAR_COLOR.light}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

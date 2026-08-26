"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { RemainingTrendPoint } from "@/hooks/useStats";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// De-emphasis gray for the line itself — this is a glance-only sparkline
// (stat-tile trend), not the full interactive chart on /stats, so it stays
// quiet by default. Same accent blue as RemainingTrendChart picks out just
// the endpoint (today), so "where things stand right now" is still the one
// thing that pops.
const LINE_COLOR = { light: "#a3a3a3", dark: "#737373" };
const ACCENT_COLOR = { light: "#2a78d6", dark: "#3987e5" };

function makeEndpointDot(accent: string, lastIndex: number) {
  return function EndpointDot(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index !== lastIndex) return null;
    return <circle cx={cx} cy={cy} r={3} fill={accent} />;
  };
}

// Fixed-size, axis-less, tooltip-less — a sparkline reads by shape alone.
// The full "Qolgan qazo" chart (axes, tooltip, delta badge) already exists
// on /stats for anyone who wants to dig in; this is just "is it trending
// down lately", answered without leaving the followee's card.
export function MiniTrendSparkline({ data }: { data: RemainingTrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  // Too few points for a shape to mean anything — nothing beats silence here.
  if (data.length < 2) return null;

  const lineColor = isDark ? LINE_COLOR.dark : LINE_COLOR.light;
  const accent = isDark ? ACCENT_COLOR.dark : ACCENT_COLOR.light;

  return (
    <div className="h-6 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Area
            type="monotone"
            dataKey="remaining"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={lineColor}
            fillOpacity={0.12}
            dot={makeEndpointDot(accent, data.length - 1)}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

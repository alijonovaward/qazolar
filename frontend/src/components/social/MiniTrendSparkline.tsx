"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import type { RemainingTrendPoint } from "@/hooks/useStats";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Same zoom RemainingTrendChart.tsx uses — without it, a real remaining
// count in the thousands makes a day-to-day swing of a few dozen round down
// to a flat line (the exact "chichib qo'yding" complaint: it stopped
// looking like a chart). Padding to the data's own range, not always
// starting at 0, is what lets the shape actually show.
function paddedDomain([dataMin, dataMax]: readonly [number, number]): [number, number] {
  const range = dataMax - dataMin;
  const padding = Math.max(Math.ceil(range * 0.1), 1);
  return [Math.max(dataMin - padding, 0), dataMax + padding];
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
    // Same 224px RemainingTrendChart uses on /stats — sized to match, not
    // a smaller "preview" of it.
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          {/* Invisible — its only job is applying the zoomed domain below,
              not showing ticks/labels (this stays an axis-less sparkline). */}
          <YAxis hide domain={paddedDomain} />
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

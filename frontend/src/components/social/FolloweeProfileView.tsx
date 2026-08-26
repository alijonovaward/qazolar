"use client";

import { useState } from "react";

import { PeriodToggle } from "@/components/stats/PeriodToggle";
import { RemainingTrendChart } from "@/components/stats/RemainingTrendChart";
import { useFolloweeRemainingTrend } from "@/hooks/useSocial";
import type { StatsPeriod } from "@/hooks/useStats";
import type { QazoRecord } from "@/types/prayer";
import type { FolloweeProfile } from "@/types/social";

import { MiniTrendSparkline } from "./MiniTrendSparkline";

// Same palette as the dashboard's PrayerRow, so a prayer reads as the same
// color everywhere in the app.
const COLORS: Record<string, string> = {
  bomdod: "bg-indigo-500",
  peshin: "bg-amber-500",
  asr: "bg-orange-500",
  shom: "bg-rose-500",
  xufton: "bg-sky-600",
  vitr: "bg-violet-600",
};

function MiniPrayerRow({ record }: { record: QazoRecord }) {
  const color = COLORS[record.prayer_type.code] ?? "bg-emerald-600";
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-neutral-500">{record.prayer_type.name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className={`h-full ${color}`} style={{ width: `${record.percent_complete}%` }} />
      </div>
      {/* A raw "1095/1095" reads as noise for someone else's numbers you have
          no context for — a percent next to the bar it's already
          illustrating is unambiguous at a glance, unlike a fraction that
          makes you do the division yourself. */}
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-500">
        {record.percent_complete}%
      </span>
    </div>
  );
}

export function FolloweeProfileView({
  profile,
  relationId,
}: {
  profile: FolloweeProfile;
  relationId: number;
}) {
  // Same visibility tier as percent_complete/current_streak (see
  // FolloweeRemainingTrendView) — only fetched once there's something to
  // show, and a 403/404 here just means the sparkline stays empty (retry:
  // false on the hook), not an error for the whole card.
  const { data: trend } = useFolloweeRemainingTrend(relationId, "week");

  // The full tabbed chart (day/week/month/year — same as /stats) is opt-in
  // per card, not fetched until someone actually asks for it — the sparkline
  // above already answers "how's it trending" for free on every card in the
  // list, this is for whoever wants to dig into one specific friend's numbers.
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const { data: fullTrend, isLoading: fullTrendLoading } = useFolloweeRemainingTrend(
    relationId,
    period,
    { enabled: expanded }
  );

  if (profile.visibility === "none") {
    return <p className="text-xs text-neutral-500">Ma&apos;lumotni ko&apos;rsatishni yoqmagan.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Shrunk from flex-1 to a fixed width — the sparkline next to it
            carries the "how's it trending" job now, this bar just gives the
            percent a quick visual anchor. */}
        <div className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${profile.percent_complete}%` }}
          />
        </div>
        {trend && <MiniTrendSparkline data={trend} />}
        <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {profile.percent_complete}%
        </span>
        {!!profile.current_streak && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            🔥 {profile.current_streak}
          </span>
        )}
      </div>

      {profile.visibility === "full" && profile.records && (
        <div className="flex flex-col gap-1.5">
          {profile.records.map((record) => (
            <MiniPrayerRow key={record.prayer_type.code} record={record} />
          ))}
        </div>
      )}

      {trend && trend.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-fit text-xs font-medium text-emerald-700 underline dark:text-emerald-400"
        >
          {expanded ? "Grafikni yashirish" : "To'liq grafikni ko'rish"}
        </button>
      )}

      {expanded && (
        <div className="flex flex-col gap-2">
          <PeriodToggle value={period} onChange={setPeriod} />
          {fullTrendLoading ? (
            <p className="flex h-64 items-center justify-center text-sm text-neutral-500">
              Yuklanmoqda...
            </p>
          ) : (
            <RemainingTrendChart data={fullTrend ?? []} />
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { RemainingTrendChart } from "@/components/stats/RemainingTrendChart";
import { useFolloweeRemainingTrend } from "@/hooks/useSocial";
import type { QazoRecord } from "@/types/prayer";
import type { FolloweeProfile } from "@/types/social";

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
  // FolloweeRemainingTrendView) — a 403/404 here just leaves the chart
  // empty (retry: false on the hook), not an error for the whole card.
  const { data: trend } = useFolloweeRemainingTrend(relationId, "week");

  if (profile.visibility === "none") {
    return <p className="text-xs text-neutral-500">Ma&apos;lumotni ko&apos;rsatishni yoqmagan.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {profile.percent_complete}%
        </span>
        {!!profile.current_streak && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            🔥 {profile.current_streak}
          </span>
        )}
      </div>

      {/* The exact same chart /stats uses for the current user — not a
          simplified/de-emphasized variant, just this component pointed at
          the followee's data instead. */}
      {trend && trend.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Qolgan qazo (umumiy qarz)
          </h3>
          <RemainingTrendChart data={trend} />
        </div>
      )}

      {profile.visibility === "full" && profile.records && (
        <div className="flex flex-col gap-1.5">
          {profile.records.map((record) => (
            <MiniPrayerRow key={record.prayer_type.code} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

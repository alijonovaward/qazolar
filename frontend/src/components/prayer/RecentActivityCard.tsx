"use client";

import { useTapLogs } from "@/hooks/useTapLogs";

import { formatRelativeTime, PRAYER_COLORS } from "./utils";

// +1/-1 taps update the server instantly, but "did that actually register?"
// is a fair doubt when there's no visible trace of it — this is that trace:
// the last 20 taps, newest first. 5 rows tall by default (matches the rest
// of the dashboard's compact cards) with the remaining 15 reachable by
// scrolling inside the card, not a separate page — the point is to confirm
// a tap right where it just happened, not to browse history.
const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.75;

export function RecentActivityCard() {
  const { data: logs, isLoading } = useTapLogs();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold">So&apos;nggi amallar</h2>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !logs?.length ? (
        <p className="text-sm text-neutral-500">Hali hech qanday amal yo&apos;q.</p>
      ) : (
        <ul
          className="flex flex-col divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800"
          style={{ maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT_REM}rem` }}
        >
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-2.5 py-2 text-sm first:pt-0 last:pb-0">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${PRAYER_COLORS[log.prayer_type.code] ?? "bg-emerald-600"}`}
              />
              <span className="min-w-0 flex-1 truncate">
                {log.prayer_type.name} — {log.field_display}
              </span>
              <span className="shrink-0 text-xs text-neutral-400">{formatRelativeTime(log.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

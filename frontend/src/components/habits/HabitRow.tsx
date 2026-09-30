import Link from "next/link";

import { formatCount } from "@/components/zikr/utils";
import type { Habit } from "@/types/habit";

// Compact list row — just enough to decide "which one do I want to open":
// name, streak, and today's number. The quick-add form, archive button, and
// history chart all live on the detail page (/habits/[id]) now, not here.
export function HabitRow({ habit }: { habit: Habit }) {
  return (
    <Link
      href={`/habits/${habit.id}`}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="min-w-0 truncate font-medium">{habit.name}</span>
        {!!habit.current_streak && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            🔥 {habit.current_streak}
          </span>
        )}
      </div>

      {habit.daily_target != null ? (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${habit.percent_complete}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">
            {formatCount(habit.today_amount)} / {formatCount(habit.daily_target)} {habit.unit} ·{" "}
            {habit.percent_complete}%
          </p>
        </>
      ) : (
        <p className="text-xs text-neutral-500">
          Bugun: {formatCount(habit.today_amount)} {habit.unit}
        </p>
      )}
    </Link>
  );
}

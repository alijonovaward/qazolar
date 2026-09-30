import Link from "next/link";

import { formatCount } from "@/components/zikr/utils";
import type { SharedHabit } from "@/types/habit";

export function SharedHabitRow({ habit }: { habit: SharedHabit }) {
  return (
    <Link
      href={`/habits/shared/${habit.id}`}
      className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold">{habit.name}</span>
        {habit.is_creator && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            Siz yaratgansiz
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-emerald-600 transition-all"
          style={{ width: `${habit.percent_complete}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          {formatCount(habit.current_count)} / {formatCount(habit.target_count)} {habit.unit}
        </span>
        <span>
          {habit.percent_complete}% · {formatCount(habit.remaining)} qoldi
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path
            d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 8c1.7 0 3 1.3 3 3s-1.3 3-3 3M18.5 14c2.6.4 4.5 1.9 4.5 4"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{formatCount(habit.participant_count)} ishtirokchi</span>
      </div>
    </Link>
  );
}

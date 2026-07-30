"use client";

import { useStreak } from "@/hooks/useStreak";

export function StreakBadge() {
  const { data } = useStreak();

  if (!data) return null;

  return (
    <div className="flex w-fit items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm dark:border-amber-800 dark:bg-amber-950">
      🔥 <span className="font-semibold">{data.current_streak}</span> kunlik seriya
    </div>
  );
}

import { displayName } from "@/components/social/utils";
import { formatCount } from "@/components/zikr/utils";
import type { Contributor } from "@/types/social";

// Medal emoji, not a plain "1./2./3." — a leaderboard for a collective goal
// is meant to feel celebratory, not like a spreadsheet rank. Shared by
// apps.zikr's Zikr and apps.habits' CollectiveHabit — same {user, count}
// shape either way.
const MEDALS = ["🥇", "🥈", "🥉"];

export function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (contributors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Top 3</h2>
      <ul className="flex flex-col gap-2">
        {contributors.map((contributor, index) => (
          <li key={contributor.user.id} className="flex items-center gap-2.5 text-sm">
            <span className="w-6 shrink-0 text-center text-base">{MEDALS[index]}</span>
            <span className="min-w-0 flex-1 truncate">{displayName(contributor.user)}</span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {formatCount(contributor.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

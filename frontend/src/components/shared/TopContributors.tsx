import { displayName } from "@/components/social/utils";
import { formatCount } from "@/components/zikr/utils";
import type { Contributor } from "@/types/social";

// Medal emoji for the top 3, a plain rank number after that — a leaderboard
// for a collective goal is meant to feel celebratory at the very top without
// turning into spreadsheet rows, but still needs to read as a real ranking
// past 3rd place. Shared by apps.zikr's Zikr and apps.habits'
// CollectiveHabit/SharedHabit — same {user, count} shape either way.
const MEDALS = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="w-6 shrink-0 text-center text-base tabular-nums text-neutral-400">
      {MEDALS[rank - 1] ?? rank}
    </span>
  );
}

export function TopContributors({
  contributors,
  myRank,
  myCount,
}: {
  contributors: Contributor[];
  myRank?: number | null;
  myCount?: number;
}) {
  if (contributors.length === 0) return null;

  // Already visible in the list above — no need to repeat it separately.
  const showMyRankSeparately = !!myRank && myRank > contributors.length;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Reyting</h2>
      <ul className="flex flex-col gap-2">
        {contributors.map((contributor, index) => (
          <li key={contributor.user.id} className="flex items-center gap-2.5 text-sm">
            <RankBadge rank={index + 1} />
            <span className="min-w-0 flex-1 truncate">{displayName(contributor.user)}</span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {formatCount(contributor.count)}
            </span>
          </li>
        ))}
      </ul>

      {showMyRankSeparately && (
        <>
          <div className="border-t border-neutral-100 dark:border-neutral-800" />
          <div className="flex items-center gap-2.5 text-sm">
            <RankBadge rank={myRank!} />
            <span className="min-w-0 flex-1 truncate font-medium">Siz</span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {formatCount(myCount ?? 0)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

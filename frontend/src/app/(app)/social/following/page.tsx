"use client";

import Link from "next/link";

import { Avatar } from "@/components/social/Avatar";
import { LoadMoreButton } from "@/components/social/LoadMoreButton";
import { SocialPageHeader } from "@/components/social/SocialPageHeader";
import { displayName } from "@/components/social/utils";
import { useFollowing, useRemoveFollowRelation } from "@/hooks/useSocial";

export default function FollowingPage() {
  const followingQuery = useFollowing();
  const remove = useRemoveFollowRelation();

  const results = followingQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const count = followingQuery.data?.pages[0]?.count;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <SocialPageHeader title="Men kuzatayotganlarim" count={count} />

      {followingQuery.isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !results.length ? (
        <p className="text-sm text-neutral-500">Hali hech kimni kuzatmayapsiz.</p>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <ul className="flex flex-col gap-3">
            {results.map((relation) => (
              <li key={relation.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/social/following/${relation.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar label={displayName(relation.followee)} />
                  <span className="min-w-0 truncate text-sm font-medium">
                    {displayName(relation.followee)}
                  </span>
                  {!!relation.followee_profile.current_streak && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      🔥 {relation.followee_profile.current_streak}
                    </span>
                  )}
                  {relation.followee_profile.percent_complete != null && (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-500">
                      {relation.followee_profile.percent_complete}%
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => remove.mutate(relation.id)}
                  disabled={remove.isPending}
                  className="min-h-8 shrink-0 rounded-full border border-red-300 px-2.5 text-xs font-medium text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                >
                  Bekor qilish
                </button>
              </li>
            ))}
          </ul>
          {followingQuery.hasNextPage && (
            <LoadMoreButton
              onClick={() => followingQuery.fetchNextPage()}
              loading={followingQuery.isFetchingNextPage}
            />
          )}
        </div>
      )}
    </main>
  );
}

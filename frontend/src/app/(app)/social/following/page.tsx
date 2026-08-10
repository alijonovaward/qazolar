"use client";

import Link from "next/link";

import { FolloweeProfileView } from "@/components/social/FolloweeProfileView";
import { LoadMoreButton } from "@/components/social/LoadMoreButton";
import { displayName } from "@/components/social/utils";
import { useFollowing, useRemoveFollowRelation } from "@/hooks/useSocial";

export default function FollowingPage() {
  const followingQuery = useFollowing();
  const remove = useRemoveFollowRelation();

  const results = followingQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const count = followingQuery.data?.pages[0]?.count;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Men kuzatayotganlarim{count != null && ` (${count})`}
        </h1>
        <Link href="/social" className="text-sm text-emerald-700 underline dark:text-emerald-400">
          Do&apos;stlarga qaytish
        </Link>
      </div>

      {followingQuery.isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !results.length ? (
        <p className="text-sm text-neutral-500">Hali hech kimni kuzatmayapsiz.</p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <ul className="flex flex-col gap-3">
            {results.map((relation) => (
              <li
                key={relation.id}
                className="flex flex-col gap-1 border-b border-neutral-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{displayName(relation.followee)}</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(relation.id)}
                    disabled={remove.isPending}
                    className="min-h-8 shrink-0 rounded-lg border border-red-300 px-2.5 text-xs font-medium text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                  >
                    Bekor qilish
                  </button>
                </div>
                <FolloweeProfileView profile={relation.followee_profile} />
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

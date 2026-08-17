"use client";

import Link from "next/link";

import { LoadMoreButton } from "@/components/social/LoadMoreButton";
import { displayName } from "@/components/social/utils";
import { useFollowers, useRemoveFollowRelation } from "@/hooks/useSocial";

export default function FollowersPage() {
  const followersQuery = useFollowers();
  const remove = useRemoveFollowRelation();

  const results = followersQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const count = followersQuery.data?.pages[0]?.count;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Meni kuzatuvchilar{count != null && ` (${count})`}
        </h1>
        <Link href="/social" className="text-sm text-emerald-700 underline dark:text-emerald-400">
          Do&apos;stlarga qaytish
        </Link>
      </div>

      {followersQuery.isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !results.length ? (
        <p className="text-sm text-neutral-500">Hali sizni hech kim kuzatmayapti.</p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <ul className="flex flex-col gap-2">
            {results.map((relation) => (
              <li key={relation.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{displayName(relation.follower)}</span>
                <button
                  type="button"
                  onClick={() => remove.mutate(relation.id)}
                  disabled={remove.isPending}
                  className="min-h-8 shrink-0 rounded-lg border border-red-300 px-2.5 text-xs font-medium text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                >
                  O&apos;chirish
                </button>
              </li>
            ))}
          </ul>
          {followersQuery.hasNextPage && (
            <LoadMoreButton
              onClick={() => followersQuery.fetchNextPage()}
              loading={followersQuery.isFetchingNextPage}
            />
          )}
        </div>
      )}
    </main>
  );
}

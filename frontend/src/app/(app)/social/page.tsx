"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { LoadMoreButton } from "@/components/social/LoadMoreButton";
import { displayName } from "@/components/social/utils";
import { ApiError } from "@/lib/api-client";
import {
  useAcceptFollowRequest,
  useFollow,
  useFollowers,
  useFollowing,
  useIncomingFollowRequests,
  useRemoveFollowRelation,
} from "@/hooks/useSocial";

function CountLink({ href, count, label }: { href: string; count: number | undefined; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col gap-0.5 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <span className="text-2xl font-semibold tabular-nums">{count ?? "…"}</span>
      <span className="text-sm text-neutral-500">{label}</span>
    </Link>
  );
}

export default function SocialPage() {
  const follow = useFollow();
  const accept = useAcceptFollowRequest();
  const remove = useRemoveFollowRelation();
  const incomingQuery = useIncomingFollowRequests();
  // Only page 1 is ever needed here — the exact count comes back on every
  // page, and the full lists live on their own pages (see /social/following,
  // /social/followers) so this hub doesn't have to render 30+ rows itself.
  const followingQuery = useFollowing();
  const followersQuery = useFollowers();

  const incomingResults = incomingQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const followingCount = followingQuery.data?.pages[0]?.count;
  const followersCount = followersQuery.data?.pages[0]?.count;

  const [followeeUsername, setFolloweeUsername] = useState("");
  const [followError, setFollowError] = useState<string | null>(null);
  const [followSent, setFollowSent] = useState<string | null>(null);

  async function handleFollow(event: FormEvent) {
    event.preventDefault();
    setFollowError(null);
    setFollowSent(null);
    const username = followeeUsername.trim();
    if (!username) return;
    try {
      await follow.mutateAsync(username);
      setFolloweeUsername("");
      setFollowSent(`@${username.replace(/^@/, "")} ga so'rov yuborildi`);
      setTimeout(() => setFollowSent(null), 3000);
    } catch (err) {
      setFollowError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Do&apos;stlar</h1>

      <div className="flex gap-3">
        <CountLink href="/social/following" count={followingCount} label="Men kuzatayotganlarim" />
        <CountLink href="/social/followers" count={followersCount} label="Meni kuzatuvchilar" />
      </div>

      <Link
        href="/profile"
        className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 text-sm transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <span>Username va kuzatuvchilarim nima ko&apos;rishini profil sahifasida sozlang</span>
        <span className="text-emerald-700 dark:text-emerald-400">→</span>
      </Link>

      <form
        onSubmit={handleFollow}
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Username orqali kuzatish</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={followeeUsername}
            onChange={(event) => setFolloweeUsername(event.target.value)}
            placeholder="dostim_username"
            className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={follow.isPending}
            className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 font-medium text-white disabled:opacity-50"
          >
            So&apos;rov yuborish
          </button>
        </div>
        {followError && <p className="text-sm text-red-600">{followError}</p>}
        {followSent && <p className="text-sm text-emerald-600 dark:text-emerald-400">{followSent}</p>}
      </form>

      {!!incomingResults.length && (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Kelgan so&apos;rovlar</h2>
          <ul className="flex flex-col gap-2">
            {incomingResults.map((request) => (
              <li key={request.id} className="flex items-center justify-between text-sm">
                <span>{displayName(request.follower)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => accept.mutate(request.id)}
                    disabled={accept.isPending}
                    className="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Qabul qilish
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(request.id)}
                    disabled={remove.isPending}
                    className="min-h-9 rounded-lg border border-neutral-300 px-3 text-xs dark:border-neutral-700"
                  >
                    Rad etish
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {incomingQuery.hasNextPage && (
            <LoadMoreButton
              onClick={() => incomingQuery.fetchNextPage()}
              loading={incomingQuery.isFetchingNextPage}
            />
          )}
        </div>
      )}
    </main>
  );
}

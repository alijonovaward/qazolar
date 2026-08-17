"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Avatar } from "@/components/social/Avatar";
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

function CountLink({
  href,
  count,
  label,
  icon,
}: {
  href: string;
  count: number | undefined;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col gap-2 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-emerald-400 dark:border-neutral-800 dark:hover:border-emerald-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        {icon}
      </span>
      <span className="text-2xl font-bold tabular-nums">{count ?? "…"}</span>
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
        <CountLink
          href="/social/following"
          count={followingCount}
          label="Men kuzatayotganlarim"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="m16.5 8.5 2 2 3.5-3.5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <CountLink
          href="/social/followers"
          count={followersCount}
          label="Meni kuzatuvchilar"
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
          }
        />
      </div>

      <Link
        href="/profile"
        className="flex items-center justify-between rounded-2xl border border-neutral-200 p-4 text-sm transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <span>Username va kuzatuvchilarim nima ko&apos;rishini profil sahifasida sozlang</span>
        <span className="text-emerald-700 dark:text-emerald-400">→</span>
      </Link>

      <form
        onSubmit={handleFollow}
        className="flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Username orqali kuzatish</h2>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              @
            </span>
            <input
              type="text"
              value={followeeUsername}
              onChange={(event) => setFolloweeUsername(event.target.value)}
              placeholder="dostim_username"
              className="min-h-11 w-full min-w-0 rounded-full border border-neutral-300 bg-transparent py-2 pl-8 pr-3 dark:border-neutral-700"
            />
          </div>
          <button
            type="submit"
            disabled={follow.isPending}
            className="min-h-11 shrink-0 rounded-full bg-emerald-600 px-5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            So&apos;rov yuborish
          </button>
        </div>
        {followError && <p className="text-sm text-red-600">{followError}</p>}
        {followSent && (
          <p className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {followSent}
          </p>
        )}
      </form>

      {!!incomingResults.length && (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Kelgan so&apos;rovlar</h2>
          <ul className="flex flex-col gap-3">
            {incomingResults.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar label={displayName(request.follower)} />
                  <span className="min-w-0 truncate text-sm">{displayName(request.follower)}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => accept.mutate(request.id)}
                    disabled={accept.isPending}
                    className="min-h-9 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Qabul qilish
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(request.id)}
                    disabled={remove.isPending}
                    className="min-h-9 rounded-full border border-neutral-300 px-3 text-xs dark:border-neutral-700"
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

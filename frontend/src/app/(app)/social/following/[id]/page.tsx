"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { BackButton } from "@/components/layout/BackButton";
import { Avatar } from "@/components/social/Avatar";
import { FolloweeProfileView } from "@/components/social/FolloweeProfileView";
import { displayName } from "@/components/social/utils";
import { useFollowing } from "@/hooks/useSocial";

export default function FollowingDetailPage() {
  const params = useParams<{ id: string }>();
  const relationId = Number(params.id);

  const followingQuery = useFollowing();
  const results = followingQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const relation = results.find((r) => r.id === relationId);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = followingQuery;

  // The common case (clicked through from the already-rendered list) always
  // finds it in what's cached — this only matters for a direct URL visit or
  // refresh, where just the first page has loaded and the relation might be
  // further down: keep paging until it turns up or the list runs out.
  useEffect(() => {
    if (!relation && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [relation, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (followingQuery.isLoading || (!relation && hasNextPage)) {
    return <p className="p-4 text-neutral-500">Yuklanmoqda...</p>;
  }

  if (!relation) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/social/following" label="Ro'yxatga qaytish" />
          <p className="text-sm text-neutral-500">Topilmadi.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton href="/social/following" label="Ro'yxatga qaytish" />
        <Avatar label={displayName(relation.followee)} />
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">
          {displayName(relation.followee)}
        </h1>
      </div>

      <FolloweeProfileView profile={relation.followee_profile} relationId={relation.id} />
    </main>
  );
}

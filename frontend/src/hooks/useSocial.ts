"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { RemainingTrendPoint } from "@/hooks/useStats";
import type { FollowingRelation, FollowRelation } from "@/types/social";

function useInvalidateFollowQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["social"] });
  };
}

// The list itself is capped at 30/page server-side (DefaultPagination) — past
// that, results just silently stopped appearing until this. `useInfiniteQuery`
// tracks page number as `pageParam` and stops offering "load more" once the
// API reports no `next` page.
function paginatedListOptions<T>(key: string[], path: string) {
  return {
    queryKey: key,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      apiClient.get<Paginated<T>>(`${path}${path.includes("?") ? "&" : "?"}page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Paginated<T>, allPages: Paginated<T>[]) =>
      lastPage.next ? allPages.length + 1 : undefined,
  };
}

export function useFollow() {
  const invalidate = useInvalidateFollowQueries();

  return useMutation({
    mutationFn: (username: string) =>
      apiClient.post<FollowRelation>("/social/follow-requests/", { username }),
    onSuccess: invalidate,
  });
}

export function useIncomingFollowRequests() {
  return useInfiniteQuery(
    paginatedListOptions<FollowRelation>(["social", "incoming"], "/social/follow-requests/incoming/")
  );
}

export function useAcceptFollowRequest() {
  const invalidate = useInvalidateFollowQueries();

  return useMutation({
    mutationFn: (id: number) => apiClient.post<FollowRelation>(`/social/follow-requests/${id}/accept/`),
    onSuccess: invalidate,
  });
}

export function useRemoveFollowRelation() {
  const invalidate = useInvalidateFollowQueries();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/social/follow-requests/${id}/`),
    onSuccess: invalidate,
  });
}

export function useFollowing() {
  return useInfiniteQuery(
    paginatedListOptions<FollowingRelation>(["social", "following"], "/social/following/")
  );
}

export function useFollowers() {
  return useInfiniteQuery(
    paginatedListOptions<FollowRelation>(["social", "followers"], "/social/followers/")
  );
}

// Fixed to "week" — this is the compact sparkline on a followee's card, not
// the full tabbed chart from /stats, so there's no period switcher to wire
// up. 404/403 (relation gone, or they turned visibility off) just leave the
// sparkline empty rather than erroring the whole card — see
// FolloweeProfileView, which renders nothing when `data` is undefined.
export function useFolloweeRemainingTrend(relationId: number) {
  return useQuery({
    queryKey: ["social", "following", relationId, "remaining-trend"],
    queryFn: () =>
      apiClient.get<RemainingTrendPoint[]>(
        `/social/following/${relationId}/remaining-trend/?period=week`
      ),
    retry: false,
  });
}

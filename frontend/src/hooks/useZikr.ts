"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Zikr } from "@/types/zikr";

// 10s, matching the tap-sync interval — this is a *collective* counter, so a
// tab that's just watching (not tapping) still needs to see other people's
// contributions arrive on its own, not only after this device's next sync.
const REFETCH_INTERVAL_MS = 10_000;

export function useZikrList() {
  return useQuery({
    queryKey: ["zikr"],
    queryFn: () => apiClient.get<Zikr[]>("/zikr/"),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useSyncZikr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      apiClient.post<Zikr>(`/zikr/${id}/sync/`, { delta }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zikr"] }),
  });
}

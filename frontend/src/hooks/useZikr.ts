"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Zikr } from "@/types/zikr";

export function useZikrList() {
  return useQuery({
    queryKey: ["zikr"],
    queryFn: () => apiClient.get<Zikr[]>("/zikr/"),
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

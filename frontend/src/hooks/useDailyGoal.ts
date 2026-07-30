"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { DailyGoal } from "@/types/prayer";

export function useDailyGoal() {
  return useQuery({
    queryKey: ["daily-goal", "today"],
    queryFn: () => apiClient.get<DailyGoal>("/daily-goal/today/"),
  });
}

export function useSetDailyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target_count: number) =>
      apiClient.put<DailyGoal>("/daily-goal/today/", { target_count }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-goal", "today"] }),
  });
}

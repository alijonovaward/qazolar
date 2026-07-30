"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useStreak() {
  return useQuery({
    queryKey: ["stats", "streak"],
    queryFn: () => apiClient.get<{ current_streak: number }>("/stats/streak/"),
  });
}

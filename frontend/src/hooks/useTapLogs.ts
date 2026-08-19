"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { TapLog } from "@/types/prayer";

export function useTapLogs() {
  return useQuery({
    queryKey: ["tap-logs"],
    queryFn: () => apiClient.get<TapLog[]>("/tap-logs/"),
  });
}

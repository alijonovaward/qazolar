"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { PrayerType } from "@/types/prayer";

export function usePrayerTypes() {
  return useQuery({
    queryKey: ["prayer-types"],
    queryFn: () => apiClient.get<Paginated<PrayerType>>("/prayer-types/"),
    staleTime: Infinity,
  });
}

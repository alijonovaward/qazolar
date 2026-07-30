"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { PrayerCode } from "@/types/prayer";

export type StatsPeriod = "day" | "week" | "month" | "year";

export interface StatsBucket {
  bucket: string;
  total_completed: number;
}

export function useStats(period: StatsPeriod, prayerType: PrayerCode | "all") {
  return useQuery({
    queryKey: ["stats", period, prayerType],
    queryFn: () =>
      apiClient.get<StatsBucket[]>(`/stats/?period=${period}&prayer_type=${prayerType}`),
  });
}

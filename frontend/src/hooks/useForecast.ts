"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Forecast } from "@/types/prayer";

export function useForecast() {
  return useQuery({
    queryKey: ["stats", "forecast"],
    queryFn: () => apiClient.get<Forecast>("/stats/forecast/"),
  });
}

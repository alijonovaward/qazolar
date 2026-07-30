"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { QazoRecord, QazoSummary } from "@/types/prayer";

export function useQazoRecords() {
  return useQuery({
    queryKey: ["qazo-records"],
    queryFn: () => apiClient.get<Paginated<QazoRecord>>("/qazo-records/"),
  });
}

export function useQazoSummary() {
  return useQuery({
    queryKey: ["qazo-records", "summary"],
    queryFn: () => apiClient.get<QazoSummary>("/qazo-records/summary/"),
  });
}

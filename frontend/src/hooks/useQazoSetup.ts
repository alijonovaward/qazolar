"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { InitialQazoSetup, PrayerCode, QazoSetupPayload } from "@/types/prayer";

export function useQazoSetups() {
  return useQuery({
    queryKey: ["qazo-setup"],
    queryFn: () => apiClient.get<Paginated<InitialQazoSetup>>("/qazo-setup/"),
  });
}

export function useUpsertQazoSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, data }: { code: PrayerCode; data: QazoSetupPayload }) =>
      apiClient.put<InitialQazoSetup>(`/qazo-setup/${code}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qazo-setup"] });
      queryClient.invalidateQueries({ queryKey: ["qazo-records"] });
      // Editing setup changes the live QazoRecord total, which the forecast
      // and both stats charts are derived from — without this they'd keep
      // showing pre-edit numbers until something else happens to refetch.
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { MenstruationPeriod } from "@/types/prayer";

export function useMenstruationPeriods() {
  return useQuery({
    queryKey: ["menstruation-periods"],
    queryFn: () =>
      apiClient.get<Paginated<MenstruationPeriod>>("/profile/menstruation-periods/"),
  });
}

export function useCreateMenstruationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { start_date: string; end_date: string | null }) =>
      apiClient.post<MenstruationPeriod>("/profile/menstruation-periods/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menstruation-periods"] }),
  });
}

export function useDeleteMenstruationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/profile/menstruation-periods/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menstruation-periods"] }),
  });
}

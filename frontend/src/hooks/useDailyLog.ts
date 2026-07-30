"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { DailyLog, DailyLogIncrementPayload } from "@/types/prayer";

export function useDailyLogsForDate(date: string) {
  return useQuery({
    queryKey: ["daily-logs", date],
    queryFn: () =>
      apiClient.get<Paginated<DailyLog>>(`/daily-logs/?date_from=${date}&date_to=${date}`),
    select: (data) => data.results,
  });
}

export function useIncrementDailyLog(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<DailyLogIncrementPayload, "date">) =>
      apiClient.post<DailyLog>("/daily-logs/increment/", { ...payload, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs", date] });
      queryClient.invalidateQueries({ queryKey: ["qazo-records"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

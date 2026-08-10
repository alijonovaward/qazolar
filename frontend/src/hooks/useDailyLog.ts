"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { DailyLog, DailyLogIncrementPayload } from "@/types/prayer";

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

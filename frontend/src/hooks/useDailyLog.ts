"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { DailyLog, DailyLogField, DailyLogIncrementPayload, QazoRecord } from "@/types/prayer";

// Mirrors apps/prayers/services/daily_log.py::increment_daily_log's field
// math exactly, so the tap can update the screen the instant it happens
// instead of waiting on a round-trip. A "*_completed" tap is a no-op once
// that bucket's debt is already paid off, same as the server-side guard —
// keeping this in sync with the backend matters, since a mismatch would
// mean this optimistic patch and the real response disagree and the number
// visibly "corrects itself" after every tap.
function applyOptimisticIncrement(record: QazoRecord, field: DailyLogField): QazoRecord {
  const next = { ...record };
  if (field === "hazar_missed") {
    next.hazar_missed += 1;
  } else if (field === "hazar_completed" && next.hazar_completed < next.hazar_missed) {
    next.hazar_completed += 1;
  } else if (field === "qasr_missed") {
    next.qasr_missed += 1;
  } else if (field === "qasr_completed" && next.qasr_completed < next.qasr_missed) {
    next.qasr_completed += 1;
  }
  next.total_missed = next.hazar_missed + next.qasr_missed;
  next.total_completed = next.hazar_completed + next.qasr_completed;
  next.remaining_hazar = Math.max(next.hazar_missed - next.hazar_completed, 0);
  next.remaining_qasr = Math.max(next.qasr_missed - next.qasr_completed, 0);
  next.remaining_count = next.remaining_hazar + next.remaining_qasr;
  next.percent_complete =
    next.total_missed === 0
      ? 100
      : Math.round((Math.min(next.total_completed, next.total_missed) / next.total_missed) * 10000) / 100;
  return next;
}

export function useIncrementDailyLog(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<DailyLogIncrementPayload, "date">) =>
      apiClient.post<DailyLog>("/daily-logs/increment/", { ...payload, date }),

    // Patch the cached qazo-records list immediately (before the request
    // even resolves) so the dashboard responds the instant you tap — with
    // several taps in a row previously each one blocked on the last one
    // finishing, which read as the buttons "freezing up". Rolled back on
    // failure; reconciled with the real server value once it lands either
    // way, so a mismatched guess never sticks around.
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["qazo-records"] });
      const previous = queryClient.getQueryData<Paginated<QazoRecord>>(["qazo-records"]);

      queryClient.setQueryData<Paginated<QazoRecord>>(["qazo-records"], (old) => {
        if (!old) return old;
        return {
          ...old,
          results: old.results.map((record) =>
            record.prayer_type.code === payload.prayer_type
              ? applyOptimisticIncrement(record, payload.field)
              : record
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["qazo-records"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs", date] });
      queryClient.invalidateQueries({ queryKey: ["qazo-records"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["tap-logs"] });
    },
  });
}

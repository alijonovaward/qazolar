"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { CollectiveHabit, Habit, HabitCreatePayload, HabitLogEntry } from "@/types/habit";

// Same 10s cadence as apps.zikr's collective counter — a tab that's just
// watching (not tapping) still needs to see other people's contributions
// arrive on its own.
const COLLECTIVE_REFETCH_INTERVAL_MS = 10_000;

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => apiClient.get<Habit[]>("/habits/"),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HabitCreatePayload) => apiClient.post<Habit>("/habits/", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useAddHabitProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      apiClient.post<Habit>(`/habits/${id}/add/`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "trend"] });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.patch<Habit>(`/habits/${id}/`, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useHabitTrend(id: number) {
  return useQuery({
    queryKey: ["habits", "trend", id],
    queryFn: () => apiClient.get<HabitLogEntry[]>(`/habits/${id}/trend/`),
  });
}

export function useCollectiveHabits() {
  return useQuery({
    queryKey: ["collective-habits"],
    queryFn: () => apiClient.get<CollectiveHabit[]>("/collective-habits/"),
    refetchInterval: COLLECTIVE_REFETCH_INTERVAL_MS,
  });
}

export function useSyncCollectiveHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      apiClient.post<CollectiveHabit>(`/collective-habits/${id}/sync/`, { delta }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collective-habits"] }),
  });
}

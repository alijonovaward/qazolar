"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Habit, HabitCreatePayload, HabitLogEntry } from "@/types/habit";

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
      queryClient.invalidateQueries({ queryKey: ["habits", "logs"] });
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

export function useHabitLogs(id: number) {
  return useQuery({
    queryKey: ["habits", "logs", id],
    queryFn: () => apiClient.get<HabitLogEntry[]>(`/habits/${id}/logs/`),
  });
}

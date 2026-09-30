"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type {
  CollectiveHabit,
  Habit,
  HabitCreatePayload,
  HabitLogEntry,
  SharedHabit,
  SharedHabitCreatePayload,
  SharedHabitInvite,
} from "@/types/habit";

// Same 10s cadence as apps.zikr's collective counter — a detail page left
// open (own habit or a shared/collective one someone else is also tapping)
// stays current on its own, no manual refresh needed.
const REFETCH_INTERVAL_MS = 10_000;

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => apiClient.get<Habit[]>("/habits/"),
    refetchInterval: REFETCH_INTERVAL_MS,
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
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useCollectiveHabits() {
  return useQuery({
    queryKey: ["collective-habits"],
    queryFn: () => apiClient.get<CollectiveHabit[]>("/collective-habits/"),
    refetchInterval: REFETCH_INTERVAL_MS,
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

// 3-bosqich — hech qachon umumiy/ochiq ro'yxat emas, faqat "men a'zo
// bo'lganlarim" (yaratganlarim ham shu ro'yxatda, chunki yaratuvchi ham
// a'zo — see backend's create_shared_habit).
export function useSharedHabits() {
  return useQuery({
    queryKey: ["shared-habits"],
    queryFn: () => apiClient.get<SharedHabit[]>("/shared-habits/"),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useCreateSharedHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SharedHabitCreatePayload) =>
      apiClient.post<SharedHabit>("/shared-habits/", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shared-habits"] }),
  });
}

export function useSyncSharedHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      apiClient.post<SharedHabit>(`/shared-habits/${id}/sync/`, { delta }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shared-habits"] }),
  });
}

export function useJoinSharedHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => apiClient.post<SharedHabit>(`/shared-habits/join/${token}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shared-habits"] }),
  });
}

export function useSendSharedHabitInvite() {
  return useMutation({
    mutationFn: ({ id, username }: { id: number; username: string }) =>
      apiClient.post<SharedHabitInvite>(`/shared-habits/${id}/invites/`, { username }),
  });
}

export function useIncomingSharedHabitInvites() {
  return useQuery({
    queryKey: ["shared-habits", "invites", "incoming"],
    queryFn: () => apiClient.get<SharedHabitInvite[]>("/shared-habits/invites/incoming/"),
  });
}

export function useAcceptSharedHabitInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.post<SharedHabit>(`/shared-habits/invites/${id}/accept/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-habits"] });
      queryClient.invalidateQueries({ queryKey: ["shared-habits", "invites", "incoming"] });
    },
  });
}

export function useRemoveSharedHabitInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/shared-habits/invites/${id}/`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shared-habits", "invites", "incoming"] }),
  });
}

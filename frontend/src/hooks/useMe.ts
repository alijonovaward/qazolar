"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<User>("/profile/me/"),
    retry: false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Partial<Pick<User, "gender" | "birth_date" | "follower_visibility" | "username">>
    ) =>
      apiClient.patch<User>("/profile/me/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

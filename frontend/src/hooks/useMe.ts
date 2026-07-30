"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<User>("/profile/me/"),
    retry: false,
  });
}

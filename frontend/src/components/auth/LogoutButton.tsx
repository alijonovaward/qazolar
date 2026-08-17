"use client";

import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await apiClient.post("/auth/logout/");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="min-h-11 rounded-lg border border-red-300 px-3 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
    >
      Chiqish
    </button>
  );
}

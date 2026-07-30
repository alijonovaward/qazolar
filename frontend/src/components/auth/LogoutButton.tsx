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
      className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
    >
      Chiqish
    </button>
  );
}

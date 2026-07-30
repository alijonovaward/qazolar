"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { apiClient, ApiError } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/login/", { email, password });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          placeholder="siz@misol.uz"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Parol</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Kirilmoqda..." : "Kirish"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/register" className="text-emerald-700 underline dark:text-emerald-400">
          Ro&apos;yxatdan o&apos;tish
        </Link>
        <Link href="/forgot-password" className="text-neutral-500 underline">
          Parolni unutdingizmi?
        </Link>
      </div>
    </form>
  );
}

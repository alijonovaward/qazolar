"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { apiClient, ApiError } from "@/lib/api-client";

type Step = "email" | "reset" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/password-reset/request/", { email });
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/password-reset/confirm/", {
        email,
        code,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <p className="text-sm">Parolingiz yangilandi.</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white"
        >
          Kirish sahifasiga o&apos;tish
        </button>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form onSubmit={handleRequest} className="flex w-full max-w-sm flex-col gap-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Emailingizni kiriting, tasdiqlash kodi yuboramiz.
        </p>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Yuborilmoqda..." : "Kod yuborish"}
        </button>
        <Link href="/login" className="text-center text-sm text-neutral-500 underline">
          Kirishga qaytish
        </Link>
      </form>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        <strong>{email}</strong> manziliga yuborilgan kodni va yangi parolni kiriting.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Tasdiqlash kodi</span>
        <input
          type="text"
          inputMode="numeric"
          required
          autoFocus
          minLength={6}
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 text-center text-lg tracking-widest dark:border-neutral-700"
          placeholder="000000"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Yangi parol</span>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Yangilanmoqda..." : "Parolni yangilash"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setError(null);
        }}
        className="min-h-11 text-sm text-neutral-500 underline"
      >
        Email&apos;ni o&apos;zgartirish
      </button>
    </form>
  );
}

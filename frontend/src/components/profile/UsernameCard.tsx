"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useUpdateMe } from "@/hooks/useMe";
import { ApiError } from "@/lib/api-client";

export function UsernameCard({ username }: { username: string | null | undefined }) {
  const updateMe = useUpdateMe();
  // Only initialized when the user clicks "O'zgartirish" — by then `username`
  // has definitely already loaded, so there's no mount-time race to sync
  // against (the pitfall with deriving input state from an async query).
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function startEditing() {
    setValue(username ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleCopy() {
    if (!username) return;
    await navigator.clipboard.writeText(`@${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await updateMe.mutateAsync({ username: value.trim() || null });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Username</h2>

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="azamjon_1"
            className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
          <p className="text-xs text-neutral-500">
            Faqat lotin harflari, raqam va pastki chiziq, 3-32 belgi. Bo&apos;sh qoldirsangiz — o&apos;chiriladi.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateMe.isPending}
              className="min-h-9 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Saqlash
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-9 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
            >
              Bekor qilish
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{username ? `@${username}` : "Tanlanmagan"}</span>
          {username && (
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-9 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
            >
              {copied ? "Nusxalandi" : "Nusxalash"}
            </button>
          )}
          <button
            type="button"
            onClick={startEditing}
            className="min-h-9 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
          >
            {username ? "O'zgartirish" : "Tanlash"}
          </button>
        </div>
      )}
      <p className="text-xs text-neutral-500">
        Do&apos;stlaringiz shu username orqali sizni kuzatishni so&apos;rashi mumkin.
      </p>
    </div>
  );
}

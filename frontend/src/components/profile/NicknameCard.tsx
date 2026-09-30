"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useUpdateMe } from "@/hooks/useMe";
import { ApiError } from "@/lib/api-client";

// Same edit-toggle shape as UsernameCard, but simpler: no uniqueness rule,
// no format restriction, no @ prefix, no "share this to be found" copy
// button — a nickname is purely how you want to appear to others (Do'stlar
// ro'yxati, musobaqa reytinglari), not a handle anyone looks you up by.
export function NicknameCard({ nickname }: { nickname: string | null | undefined }) {
  const updateMe = useUpdateMe();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setValue(nickname ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await updateMe.mutateAsync({ nickname: value.trim() || null });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nickname</h2>

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            maxLength={50}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Masalan: Botir aka"
            className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
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
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-lg font-semibold">{nickname || "Tanlanmagan"}</span>
          <button
            type="button"
            onClick={startEditing}
            className="min-h-9 shrink-0 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
          >
            {nickname ? "O'zgartirish" : "Tanlash"}
          </button>
        </div>
      )}
      <p className="text-xs text-neutral-500">
        Do&apos;stlar ro&apos;yxati va musobaqa reytinglarida shu nom bilan ko&apos;rinasiz
        (qo&apos;ymasangiz — email ko&apos;rinadi).
      </p>
    </div>
  );
}

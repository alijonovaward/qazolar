"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useUpdateMe } from "@/hooks/useMe";
import { ApiError } from "@/lib/api-client";
import type { Gender } from "@/types/user";

const GENDER_LABELS: Record<Gender, string> = {
  male: "Erkak",
  female: "Ayol",
  unspecified: "Ko'rsatilmagan",
};

export function PersonalInfoCard({
  gender,
  birthDate,
}: {
  gender: Gender | undefined;
  birthDate: string | null | undefined;
}) {
  const updateMe = useUpdateMe();
  const [editing, setEditing] = useState(false);
  const [genderValue, setGenderValue] = useState<Gender>("unspecified");
  const [birthValue, setBirthValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setGenderValue(gender ?? "unspecified");
    setBirthValue(birthDate ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await updateMe.mutateAsync({ gender: genderValue, birth_date: birthValue || null });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Shaxsiy ma&apos;lumotlar</h2>

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Jins</span>
            <select
              value={genderValue}
              onChange={(event) => setGenderValue(event.target.value as Gender)}
              className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
            >
              {(Object.entries(GENDER_LABELS) as [Gender, string][]).map(([option, label]) => (
                <option key={option} value={option}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Tug&apos;ilgan sana</span>
            <input
              type="date"
              value={birthValue}
              onChange={(event) => setBirthValue(event.target.value)}
              className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
            />
          </label>
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
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Jins</span>
            <span>{GENDER_LABELS[gender ?? "unspecified"]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Tug&apos;ilgan sana</span>
            <span>{birthDate ? new Date(birthDate).toLocaleDateString("uz-UZ") : "Kiritilmagan"}</span>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="mt-1 min-h-9 self-start rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
          >
            O&apos;zgartirish
          </button>
        </div>
      )}
    </div>
  );
}

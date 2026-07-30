"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import {
  useCreateMenstruationPeriod,
  useDeleteMenstruationPeriod,
  useMenstruationPeriods,
} from "@/hooks/useMenstruationPeriods";

export function MenstruationPeriodsSection() {
  const { data } = useMenstruationPeriods();
  const createMutation = useCreateMenstruationPeriod();
  const deleteMutation = useDeleteMenstruationPeriod();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!start) return;
    await createMutation.mutateAsync({ start_date: start, end_date: end || null });
    setStart("");
    setEnd("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="font-semibold">Hayz/nifos kunlari (ixtiyoriy, maxfiy)</h3>
      <p className="text-xs text-neutral-500">
        Bu kunlar qazo hisobidan avtomatik chiqarib tashlanadi.
      </p>

      {data && data.results.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {data.results.map((period) => (
            <li key={period.id} className="flex items-center justify-between">
              <span>
                {period.start_date} — {period.end_date ?? "davom etmoqda"}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(period.id)}
                className="text-xs text-red-600"
              >
                O&apos;chirish
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Boshlanish</span>
          <input
            type="date"
            required
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Tugash (ixtiyoriy)</span>
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm dark:border-neutral-700"
        >
          Qo&apos;shish
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useCreateHabit } from "@/hooks/useHabits";

export function NewHabitForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  const createHabit = useCreateHabit();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !unit.trim()) return;
    createHabit.mutate(
      {
        name: name.trim(),
        unit: unit.trim(),
        daily_target: target ? Number(target) : null,
      },
      { onSuccess: onDone }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nomi</span>
        <input
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masalan: Turnikka tortish"
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Birlik</span>
        <input
          required
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="Masalan: marta, daqiqa, bet, qadam"
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Kunlik maqsad (ixtiyoriy)</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="Bo'sh qoldirsangiz, shunchaki kuzatiladi"
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      </label>
      <button
        type="submit"
        disabled={createHabit.isPending}
        className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
      >
        {createHabit.isPending ? "Qo'shilmoqda..." : "Vazifa qo'shish"}
      </button>
    </form>
  );
}

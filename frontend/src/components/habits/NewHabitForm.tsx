"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { useCreateHabit, useCreateSharedHabit } from "@/hooks/useHabits";

export function NewHabitForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  // Shaxsiy (kunlik, faqat o'ziga) yoki sherikli (bitta umumiy maqsad,
  // faqat taklif qilingan/link orqali qo'shilganlar ko'radi) — ikkalasi
  // butunlay boshqa shakl (kunlik maqsad vs umumiy maqsad), shuning uchun
  // bitta forma, lekin rejimga qarab boshqa maydon va boshqa yaratish
  // so'rovi.
  const [isShared, setIsShared] = useState(false);
  const createHabit = useCreateHabit();
  const createSharedHabit = useCreateSharedHabit();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !unit.trim()) return;

    if (isShared) {
      const targetCount = Number(target);
      if (!targetCount || targetCount <= 0) return;
      createSharedHabit.mutate(
        { name: name.trim(), unit: unit.trim(), target_count: targetCount },
        {
          // To'g'ridan-to'g'ri o'zi sahifasiga — taklif qilish shu yerda,
          // ro'yxatga qaytib, qayta topib o'tirish shart emas.
          onSuccess: (created) => router.push(`/habits/shared/${created.id}`),
        }
      );
      return;
    }

    createHabit.mutate(
      { name: name.trim(), unit: unit.trim(), daily_target: target ? Number(target) : null },
      { onSuccess: onDone }
    );
  }

  const isPending = createHabit.isPending || createSharedHabit.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isShared}
          onChange={(event) => setIsShared(event.target.checked)}
          className="h-4 w-4"
        />
        <span className="font-medium">Ommaviy qilish (do&apos;stlar bilan)</span>
      </label>
      {isShared && (
        <p className="text-xs text-neutral-500">
          Hech kimga ochiq bo&apos;lmaydi — faqat siz taklif qilgan yoki link orqali qo&apos;shilgan
          odamlar ko&apos;radi.
        </p>
      )}

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
      {isShared ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Umumiy maqsad</span>
          <input
            required
            type="number"
            inputMode="numeric"
            min={1}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Masalan: 50000"
            className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
        </label>
      ) : (
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
      )}
      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Qo'shilmoqda..." : "Vazifa qo'shish"}
      </button>
    </form>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { HabitTrendChart } from "@/components/habits/HabitTrendChart";
import { BackButton } from "@/components/layout/BackButton";
import { formatCount } from "@/components/zikr/utils";
import { useAddHabitProgress, useArchiveHabit, useHabits, useHabitTrend } from "@/hooks/useHabits";

export default function HabitDetailPage() {
  const params = useParams<{ id: string }>();
  const habitId = Number(params.id);
  const router = useRouter();

  const { data: habits, isLoading } = useHabits();
  const habit = habits?.find((h) => h.id === habitId);
  const { data: trend } = useHabitTrend(habitId);
  const addProgress = useAddHabitProgress();
  const archive = useArchiveHabit();

  const [amount, setAmount] = useState("");

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    addProgress.mutate({ id: habitId, amount: value });
    setAmount("");
  }

  if (isLoading) {
    return <p className="p-4 text-neutral-500">Yuklanmoqda...</p>;
  }

  if (!habit) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/habits" label="Vazifalarga qaytish" />
          <p className="text-sm text-neutral-500">Vazifa topilmadi.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton href="/habits" label="Vazifalarga qaytish" />
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{habit.name}</h1>
        {!!habit.current_streak && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            🔥 {habit.current_streak}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        {habit.daily_target != null ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${habit.percent_complete}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Bugun: {formatCount(habit.today_amount)} / {formatCount(habit.daily_target)} {habit.unit} ·{" "}
              {habit.percent_complete}%
            </p>
          </>
        ) : (
          <p className="text-xs text-neutral-500">
            Bugun: {formatCount(habit.today_amount)} {habit.unit}
          </p>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`+ ${habit.unit}`}
            className="min-h-9 w-24 min-w-0 rounded-lg border border-neutral-300 bg-transparent px-2 text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={addProgress.isPending}
            className="min-h-9 shrink-0 rounded-full bg-emerald-600 px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Qo&apos;shish
          </button>
          <button
            type="button"
            onClick={() => archive.mutate(habitId, { onSuccess: () => router.push("/habits") })}
            disabled={archive.isPending}
            className="ml-auto min-h-9 shrink-0 rounded-full border border-red-300 px-2.5 text-xs font-medium text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
          >
            Arxivlash
          </button>
        </form>
      </div>

      {trend && <HabitTrendChart data={trend} unit={habit.unit} dailyTarget={habit.daily_target} />}
    </main>
  );
}

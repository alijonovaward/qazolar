"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { BackButton } from "@/components/layout/BackButton";
import { TopContributors } from "@/components/shared/TopContributors";
import { formatCount, formatDate } from "@/components/zikr/utils";
import { useCollectiveHabits, useSyncCollectiveHabit } from "@/hooks/useHabits";

export default function CollectiveHabitDetailPage() {
  const params = useParams<{ id: string }>();
  const habitId = Number(params.id);

  const { data: habits, isLoading } = useCollectiveHabits();
  const habit = habits?.find((h) => h.id === habitId);
  const sync = useSyncCollectiveHabit();
  const [amount, setAmount] = useState("");

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    sync.mutate({ id: habitId, delta: value });
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

  const isComplete = habit.remaining === 0;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton href="/habits" label="Vazifalarga qaytish" />
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{habit.name}</h1>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${habit.percent_complete}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{habit.percent_complete}% bajarildi</span>
          <span>
            {formatCount(habit.remaining)} {habit.unit} qoldi
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          Jami: {formatCount(habit.current_count)} / {formatCount(habit.target_count)} {habit.unit} ·{" "}
          {habit.participant_count} ishtirokchi · Sizning hissangiz: {formatCount(habit.my_count)}{" "}
          {habit.unit}
        </p>
        <p className="text-xs text-neutral-400">
          {habit.completed_at ? (
            <>
              {formatDate(habit.created_at)} – {formatDate(habit.completed_at)} ·{" "}
              {habit.duration_days} kun davom etdi
            </>
          ) : (
            <>Boshlangan: {formatDate(habit.created_at)}</>
          )}
        </p>
      </div>

      <TopContributors
        contributors={habit.top_contributors}
        myRank={habit.my_rank}
        myCount={habit.my_count}
      />

      {!isComplete && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`+ ${habit.unit}`}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={sync.isPending}
            className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 font-medium text-white disabled:opacity-50"
          >
            Qo&apos;shish
          </button>
        </form>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";

import { HabitRow } from "@/components/habits/HabitRow";
import { NewHabitForm } from "@/components/habits/NewHabitForm";
import { useHabits } from "@/hooks/useHabits";

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Vazifalar</h1>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="min-h-9 shrink-0 rounded-full bg-emerald-600 px-3 text-sm font-medium text-white"
        >
          {showForm ? "Bekor qilish" : "+ Yangi vazifa"}
        </button>
      </div>

      {showForm && <NewHabitForm onDone={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !habits?.length ? (
        <p className="text-sm text-neutral-500">
          Hali hech qanday vazifa yo&apos;q — o&apos;zingizga mos kunlik vazifa qo&apos;shing (masalan
          turnikka tortish, kitob o&apos;qish, yurish).
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </main>
  );
}

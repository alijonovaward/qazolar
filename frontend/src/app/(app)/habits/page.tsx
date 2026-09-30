"use client";

import { useState } from "react";

import { CollectiveHabitRow } from "@/components/habits/CollectiveHabitRow";
import { HabitRow } from "@/components/habits/HabitRow";
import { IncomingSharedHabitInvites } from "@/components/habits/IncomingSharedHabitInvites";
import { NewHabitForm } from "@/components/habits/NewHabitForm";
import { SharedHabitRow } from "@/components/habits/SharedHabitRow";
import { useCollectiveHabits, useHabits, useSharedHabits } from "@/hooks/useHabits";

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const { data: collectiveHabits, isLoading: collectiveLoading } = useCollectiveHabits();
  const { data: sharedHabits, isLoading: sharedLoading } = useSharedHabits();
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

      <IncomingSharedHabitInvites />

      {showForm && <NewHabitForm onDone={() => setShowForm(false)} />}

      {/* Har bir bo'lim sarlavhasi bilan — "Sherikli"/"Jamoaviy" nomlangan
          bo'lsa-yu, shaxsiylari nomlanmasa, ro'yxatga kirgan odam qaysi
          qatorlar shaxsiy ekanini taxmin qilishga majbur bo'lardi. */}
      <h2 className="mt-2 text-lg font-semibold">Shaxsiy vazifalar</h2>
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

      {/* 3-bosqich: o'zim yaratgan yoki taklif/link orqali qo'shilgan —
          hech qachon umumiy ro'yxat emas. Faqat menda biror shunday vazifa
          bo'lsagina ko'rinadi. */}
      {!sharedLoading && !!sharedHabits?.length && (
        <>
          <h2 className="mt-2 text-lg font-semibold">Sherikli vazifalar</h2>
          <div className="flex flex-col gap-3">
            {sharedHabits.map((habit) => (
              <SharedHabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </>
      )}

      {/* Admin-curated, hammaga ochiq — shaxsiy vazifalardan farqli, bularni
          o'zingiz yaratmaysiz, faqat hissa qo'shasiz. Ro'yxatda hech biri
          bo'lmasa, bo'limning o'zi ham ko'rinmaydi. */}
      {!collectiveLoading && !!collectiveHabits?.length && (
        <>
          <h2 className="mt-2 text-lg font-semibold">Jamoaviy vazifalar</h2>
          <div className="flex flex-col gap-3">
            {collectiveHabits.map((habit) => (
              <CollectiveHabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

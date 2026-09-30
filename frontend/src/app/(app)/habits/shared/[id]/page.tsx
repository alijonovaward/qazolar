"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { BackButton } from "@/components/layout/BackButton";
import { TopContributors } from "@/components/shared/TopContributors";
import { formatCount, formatDate } from "@/components/zikr/utils";
import { ApiError } from "@/lib/api-client";
import {
  useSendSharedHabitInvite,
  useSharedHabits,
  useSyncSharedHabit,
} from "@/hooks/useHabits";

function InviteSection({ habitId }: { habitId: number }) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sendInvite = useSendSharedHabitInvite();
  const { data: habits } = useSharedHabits();
  const habit = habits?.find((h) => h.id === habitId);

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) return;
    setMessage(null);
    sendInvite.mutate(
      { id: habitId, username: username.trim() },
      {
        onSuccess: () => {
          setMessage(`@${username.trim()} taklif qilindi`);
          setUsername("");
        },
        onError: (err) => setMessage(err instanceof ApiError ? err.message : "Xatolik yuz berdi"),
      }
    );
  }

  function handleCopyLink() {
    if (!habit) return;
    const link = `${window.location.origin}/habits/join/${habit.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Do&apos;stlaringizni taklif qiling
      </h2>

      <button
        type="button"
        onClick={handleCopyLink}
        className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium dark:border-neutral-700"
      >
        {copied ? "Nusxalandi ✓" : "Havolani nusxalash"}
      </button>

      <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="username"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={sendInvite.isPending}
          className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 font-medium text-white disabled:opacity-50"
        >
          Taklif qilish
        </button>
      </form>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </div>
  );
}

export default function SharedHabitDetailPage() {
  const params = useParams<{ id: string }>();
  const habitId = Number(params.id);

  const { data: habits, isLoading } = useSharedHabits();
  const habit = habits?.find((h) => h.id === habitId);
  const sync = useSyncSharedHabit();
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

      <TopContributors contributors={habit.top_contributors} />

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

      {/* Faqat yaratuvchi taklif qila oladi (see backend's
          SharedHabitInviteCreateView) — boshqa a'zolarga bu bo'lim
          ko'rinmaydi. */}
      {habit.is_creator && <InviteSection habitId={habit.id} />}
    </main>
  );
}

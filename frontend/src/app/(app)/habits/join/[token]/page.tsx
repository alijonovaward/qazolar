"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { useJoinSharedHabit } from "@/hooks/useHabits";

// Reached either straight from an already-logged-in tap on the link, or
// after proxy.ts bounced a logged-out visitor to /login?next=/habits/join/...
// and LoginForm sent them right back here post-login — either way, by the
// time this component mounts there's a session, so joining just happens.
export default function JoinSharedHabitPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const join = useJoinSharedHabit();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    // The ref (not the dependency array) is what actually prevents a
    // double-fire — join.mutate is safe to call again on a re-run, this
    // just stops it from posting the join twice for the same visit.
    if (attempted.current) return;
    attempted.current = true;
    join.mutate(params.token, {
      onSuccess: (habit) => router.replace(`/habits/shared/${habit.id}`),
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : "Bu havola noto'g'ri yoki eskirgan"),
    });
  }, [params.token, join, router]);

  if (error) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-3 p-8 text-center">
      <p className="text-sm text-neutral-500">Qo&apos;shilmoqda...</p>
    </main>
  );
}

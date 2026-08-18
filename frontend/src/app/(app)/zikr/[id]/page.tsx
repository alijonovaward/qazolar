"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { BackButton } from "@/components/layout/BackButton";
import { formatCount } from "@/components/zikr/utils";
import { useSyncZikr, useZikrList } from "@/hooks/useZikr";

const SYNC_INTERVAL_MS = 10_000;

const noopSubscribe = () => () => {};

// SSR-safe read of a previous session's unsynced taps — 0 on the server (and
// on the client's very first paint, so there's no hydration mismatch),
// automatically corrected to the real stored value right after mount. This
// is the react-hooks-idiomatic way to read a browser-only store like
// localStorage (same trick as ThemeToggle.tsx's mount-detection).
function useStoredDelta(key: string): number {
  return useSyncExternalStore(
    noopSubscribe,
    () => Number(localStorage.getItem(key) ?? 0),
    () => 0
  );
}

export default function ZikrCountPage() {
  const params = useParams<{ id: string }>();
  const zikrId = Number(params.id);
  const storageKey = `zikr-pending-${zikrId}`;

  const { data: zikrs, isLoading } = useZikrList();
  const zikr = zikrs?.find((z) => z.id === zikrId);
  const { mutate: syncMutate, isPending: syncing } = useSyncZikr();

  // "Defaults" derived straight from data at render time (query for
  // baseCount, localStorage for the restored delta) — "overrides" set only
  // from event handlers (a tap, or a sync response landing), never from an
  // effect. Same defaults+overrides shape as SetupWizard.tsx.
  const restoredDelta = useStoredDelta(storageKey);
  const [overrideBase, setOverrideBase] = useState<number | null>(null);
  const [overrideMyCount, setOverrideMyCount] = useState<number | null>(null);
  const [overrideDelta, setOverrideDelta] = useState<number | null>(null);

  // Not a plain "override wins forever": useZikrList polls every 10s in the
  // background too (see useZikr.ts), so other people's taps show up on
  // their own even if this device never taps again. Whichever source has
  // seen the higher number wins — the total only ever grows, so that's
  // always the fresher one, whether it came from our own last sync
  // response or from the background poll picking up someone else's.
  const baseCount = Math.max(overrideBase ?? 0, zikr?.current_count ?? 0);
  const myBaseCount = Math.max(overrideMyCount ?? 0, zikr?.my_count ?? 0);
  const localDelta = overrideDelta ?? restoredDelta;

  // Always-current mirrors for the interval/unload handlers below, which
  // would otherwise close over stale values.
  const localDeltaRef = useRef(localDelta);
  useEffect(() => {
    localDeltaRef.current = localDelta;
  }, [localDelta]);
  const baseCountRef = useRef(baseCount);
  useEffect(() => {
    baseCountRef.current = baseCount;
  }, [baseCount]);

  // When a sync lands, the new total can jump by more than what *this*
  // device just sent — other people tapping the same zikr in the same
  // window get folded in too. Without calling that out, the number visibly
  // moving on its own looks like a bug. Shown for ~3s then faded out.
  const [othersBump, setOthersBump] = useState<{ amount: number; visible: boolean } | null>(null);

  const flush = useCallback(() => {
    const delta = localDeltaRef.current;
    if (delta <= 0) return;
    syncMutate(
      { id: zikrId, delta },
      {
        onSuccess: (updated) => {
          const expectedTotal = baseCountRef.current + delta;
          const fromOthers = updated.current_count - expectedTotal;
          if (fromOthers > 0) {
            setOthersBump({ amount: fromOthers, visible: true });
            setTimeout(() => setOthersBump((b) => (b ? { ...b, visible: false } : b)), 2300);
            setTimeout(() => setOthersBump(null), 3000);
          }

          setOverrideBase(updated.current_count);
          setOverrideMyCount(updated.my_count);
          // Subtract exactly what was sent, not reset to 0 — any taps that
          // landed while this request was in flight stay counted.
          const remainder = Math.max(localDeltaRef.current - delta, 0);
          setOverrideDelta(remainder);
          if (remainder > 0) {
            localStorage.setItem(storageKey, String(remainder));
          } else {
            localStorage.removeItem(storageKey);
          }
        },
        // on error: state/localStorage are left untouched, so the next 10s
        // tick (or the next tap) just retries with the same taps.
      }
    );
    // baseCountRef/localDeltaRef are stable ref objects — listed only to
    // satisfy the compiler's dependency inference, not because their
    // .current changing should ever re-create this callback.
  }, [syncMutate, zikrId, storageKey, baseCountRef, localDeltaRef]);

  useEffect(() => {
    const interval = setInterval(flush, SYNC_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", flush);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [flush]);

  if (isLoading) {
    return <p className="p-4 text-neutral-500">Yuklanmoqda...</p>;
  }

  if (!zikr) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/zikr" label="Ro'yxatga qaytish" />
          <p className="text-sm text-neutral-500">Zikr topilmadi.</p>
        </div>
      </main>
    );
  }

  // Once the collective goal is hit, nobody can add any more — the server
  // enforces this too (see sync_zikr_count), this just stops new local taps
  // from ever being buffered in the first place and caps what's shown so the
  // number never visibly ticks past the target.
  const isComplete = baseCount + localDelta >= zikr.target_count;
  const displayedCount = Math.min(baseCount + localDelta, zikr.target_count);
  const percent = zikr.target_count === 0 ? 100 : (displayedCount / zikr.target_count) * 100;
  const remaining = Math.max(zikr.target_count - displayedCount, 0);
  // The tap button shows *your* running tally, not the collective one —
  // the collective total already has its own place in the card above, and
  // watching your own count go up 1-by-1 as you tap is the whole point of
  // this screen.
  const myDisplayedCount = myBaseCount + localDelta;

  function handleTap() {
    if (isComplete) return;
    const next = localDelta + 1;
    localStorage.setItem(storageKey, String(next));
    setOverrideDelta(next);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton href="/zikr" label="Ro'yxatga qaytish" />
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{zikr.transliteration}</h1>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{percent.toFixed(1)}% bajarildi</span>
          <span>{formatCount(remaining)} qoldi</span>
        </div>
        <p className="text-xs text-neutral-500">
          Jami: {formatCount(displayedCount)} / {formatCount(zikr.target_count)} ·{" "}
          {zikr.participant_count} ishtirokchi{syncing && " · sinxronlanmoqda..."}
        </p>
        {othersBump && (
          <p
            className={`text-xs font-medium text-emerald-600 transition-opacity duration-700 dark:text-emerald-400 ${
              othersBump.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            +{formatCount(othersBump.amount)} boshqa foydalanuvchilar bilan
          </p>
        )}
      </div>

      {/* On the bottom half of the screen — this is what gets tapped over
          and over, so it belongs where a thumb comfortably reaches. */}
      <button
        type="button"
        onClick={handleTap}
        disabled={isComplete}
        className="mt-4 flex select-none flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center transition-colors active:bg-emerald-50 disabled:cursor-default disabled:active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-emerald-950 dark:disabled:active:bg-neutral-900"
      >
        <span dir="rtl" className="text-3xl leading-relaxed">
          {zikr.arabic_text}
        </span>
        {/* Directly under the Arabic — this is what someone who can't read
            Arabic script actually reads off of to follow along. */}
        <span className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          {zikr.transliteration}
        </span>
        <span className="text-sm text-neutral-500">{zikr.translation}</span>
        <span className="text-5xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
          {formatCount(myDisplayedCount)}
        </span>
        <span className="text-xs text-neutral-400">
          {isComplete ? "Maqsadga yetdi ✅" : "sizning hissangiz — bosish uchun shu yerga teging"}
        </span>
      </button>
    </main>
  );
}

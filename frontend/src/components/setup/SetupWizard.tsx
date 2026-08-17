"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMe } from "@/hooks/useMe";
import { usePrayerTypes } from "@/hooks/usePrayerTypes";
import { useQazoRecords } from "@/hooks/useQazoRecords";
import { useQazoSetups, useUpsertQazoSetup } from "@/hooks/useQazoSetup";
import type { PrayerCode, QazoSetupPayload } from "@/types/prayer";

import { MenstruationPeriodsSection } from "./MenstruationPeriodsSection";

interface StepForm {
  hazar: string;
  qasr: string;
}

// hazar_manual_override_count is only the *historical* debt entered at setup
// time — the live QazoRecord total also includes every dashboard +/- tap
// logged since (record.hazar_missed = override + sum of logged taps). So
// this field alone is stale once the user has actually used the app; the
// gap between the two is exactly what's already been tapped.
interface PrayerDefaults {
  form: StepForm;
  loggedSinceSetup: { hazar: number; qasr: number };
}

export function SetupWizard() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: prayerTypes, isLoading: typesLoading } = usePrayerTypes();
  const { data: setups, isLoading: setupsLoading } = useQazoSetups();
  const { data: records, isLoading: recordsLoading } = useQazoRecords();
  const upsert = useUpsertQazoSetup();

  const [stepIndex, setStepIndex] = useState(0);
  // Only the fields the user has actually touched this session — merged with
  // `defaults` (below) at render time. Keeping edits separate from the
  // server-derived defaults means there's no "sync state from a query once
  // it loads" effect to get racy: whichever of prayerTypes/setups resolves
  // last, the merge just picks it up on the next render.
  const [overrides, setOverrides] = useState<Partial<Record<PrayerCode, Partial<StepForm>>>>({});
  const [saving, setSaving] = useState(false);

  const defaults = useMemo(() => {
    if (!prayerTypes || !setups || !records) return null;
    const setupByCode = new Map(setups.results.map((s) => [s.prayer_type.code, s]));
    const recordByCode = new Map(records.results.map((r) => [r.prayer_type.code, r]));
    const map: Partial<Record<PrayerCode, PrayerDefaults>> = {};
    for (const pt of prayerTypes.results) {
      const existing = setupByCode.get(pt.code);
      const record = recordByCode.get(pt.code);
      const overrideHazar = existing?.hazar_manual_override_count ?? 0;
      const overrideQasr = existing?.qasr_manual_override_count ?? 0;
      // The live total already reflects everything — show *that*, not the
      // stale original estimate, so re-opening setup after using the app for
      // a while doesn't look like the tapped progress got forgotten.
      const currentHazar = record?.hazar_missed ?? overrideHazar;
      const currentQasr = record?.qasr_missed ?? overrideQasr;
      map[pt.code] = {
        form: {
          hazar: existing ? String(currentHazar) : "",
          qasr: existing ? String(currentQasr) : "",
        },
        loggedSinceSetup: {
          hazar: currentHazar - overrideHazar,
          qasr: currentQasr - overrideQasr,
        },
      };
    }
    return map;
  }, [prayerTypes, setups, records]);

  if (typesLoading || setupsLoading || recordsLoading || !defaults || !prayerTypes) {
    return <p className="p-4 text-neutral-500">Yuklanmoqda...</p>;
  }

  const prayers = prayerTypes.results;
  const hasMenstruationStep = me?.gender === "female";
  const totalSteps = prayers.length + (hasMenstruationStep ? 1 : 0);
  const isMenstruationStep = stepIndex === prayers.length;
  const currentPrayer = isMenstruationStep ? null : prayers[stepIndex];
  const isLastStep = stepIndex + 1 >= totalSteps;
  // Bomdod/Shom/Vitr don't shorten under safar (qasr rakat count == hazar
  // rakat count for them) — a separate "safar" debt is meaningless there, so
  // don't ask for it.
  const showQasrField = !!currentPrayer && currentPrayer.qasr_rakat_count !== currentPrayer.rakat_count;
  const currentDefaults = currentPrayer ? defaults[currentPrayer.code] : null;
  const form: StepForm | null = currentPrayer
    ? { ...currentDefaults!.form, ...overrides[currentPrayer.code] }
    : null;

  function updateForm(patch: Partial<StepForm>) {
    if (!currentPrayer) return;
    setOverrides((prev) => ({
      ...prev,
      [currentPrayer.code]: { ...prev[currentPrayer.code], ...patch },
    }));
  }

  async function saveCurrentPrayerStep() {
    if (!currentPrayer || !form || !currentDefaults) return;
    const enteredHazar = form.hazar !== "" ? Number(form.hazar) : 0;
    const enteredQasr = showQasrField && form.qasr !== "" ? Number(form.qasr) : 0;
    // The field shows the *current* total (see `defaults` above), but the
    // server only stores the historical part — subtract back out what's
    // already been tapped since setup so those taps don't get double-counted
    // on top of the new number. Clamped at 0: can't set the total below what
    // was already logged, since those taps are real dated history.
    const hazarOverride = Math.max(enteredHazar - currentDefaults.loggedSinceSetup.hazar, 0);
    const qasrOverride = showQasrField
      ? Math.max(enteredQasr - currentDefaults.loggedSinceSetup.qasr, 0)
      : 0;
    const payload: QazoSetupPayload = {
      // No explicit "Qoldirmayman" choice anymore — always "owes_qazo" and
      // let the override number itself carry the "0 debt" case. The backend
      // treats status=consistent as "force total to 0, ignore everything
      // else" — sending that here would silently wipe out already-logged
      // taps whenever the entered number came out at/below what's logged.
      status: "owes_qazo",
      hazar_manual_override_count: hazarOverride,
      qasr_manual_override_count: qasrOverride,
    };
    setSaving(true);
    try {
      await upsert.mutateAsync({ code: currentPrayer.code, data: payload });
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (!isMenstruationStep) await saveCurrentPrayerStep();
    if (isLastStep) {
      router.push("/dashboard");
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  async function goBack() {
    if (!isMenstruationStep) await saveCurrentPrayerStep();
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === stepIndex ? "bg-emerald-600" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-neutral-500">
        {stepIndex + 1} / {totalSteps}
      </p>

      {isMenstruationStep ? (
        <MenstruationPeriodsSection />
      ) : (
        currentPrayer &&
        form && (
          <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{currentPrayer.name}</h2>
              <span className="text-xs text-neutral-500">{currentPrayer.rakat_count} rakat</span>
            </div>

            <p className="text-xs text-neutral-500">
              Qancha qazongiz borligini kiriting. Bilmasangiz yoki qoldirmasangiz, bo&apos;sh
              qoldiring — 0 deb hisoblanadi.
            </p>

            <div className="flex gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <span>{showQasrField ? "Oddiy" : "Qazo soni"}</span>
                <input
                  type="number"
                  min={0}
                  value={form.hazar}
                  onChange={(event) => updateForm({ hazar: event.target.value })}
                  placeholder="0"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
                />
              </label>
              {showQasrField && (
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <span>Safar</span>
                  <input
                    type="number"
                    min={0}
                    value={form.qasr}
                    onChange={(event) => updateForm({ qasr: event.target.value })}
                    placeholder="0"
                    className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
                  />
                </label>
              )}
            </div>
          </div>
        )
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0 || saving}
          className="min-h-11 flex-1 rounded-lg border border-neutral-300 font-medium disabled:opacity-40 dark:border-neutral-700"
        >
          Orqaga
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={saving}
          className="min-h-11 flex-1 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saqlanmoqda..." : isLastStep ? "Yakunlash" : "Keyingisi"}
        </button>
      </div>
    </div>
  );
}

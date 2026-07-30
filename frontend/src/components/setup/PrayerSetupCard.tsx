"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { InitialQazoSetup, PrayerType, QazoSetupPayload, SetupStatus } from "@/types/prayer";

interface Props {
  prayerType: PrayerType;
  existing?: InitialQazoSetup;
  onSave: (data: QazoSetupPayload) => Promise<unknown>;
}

export function PrayerSetupCard({ prayerType, existing, onSave }: Props) {
  const [status, setStatus] = useState<SetupStatus>(existing?.status ?? "consistent");
  const [manualCount, setManualCount] = useState(
    existing?.manual_override_count != null ? String(existing.manual_override_count) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        status,
        manual_override_count:
          status === "owes_qazo" && manualCount !== "" ? Number(manualCount) : null,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{prayerType.name}</h3>
        <span className="text-xs text-neutral-500">{prayerType.rakat_count} rakat</span>
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`status-${prayerType.code}`}
            checked={status === "consistent"}
            onChange={() => setStatus("consistent")}
          />
          Qoldirmayman
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`status-${prayerType.code}`}
            checked={status === "owes_qazo"}
            onChange={() => setStatus("owes_qazo")}
          />
          Qazosi bor
        </label>
      </div>

      {status === "owes_qazo" && (
        <input
          type="number"
          min={0}
          placeholder="Taxminiy qazo soni (bilmasangiz, bo'sh qoldiring)"
          value={manualCount}
          onChange={(event) => setManualCount(event.target.value)}
          className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 dark:border-neutral-700"
        />
      )}

      <button
        type="submit"
        disabled={saving}
        className="min-h-11 rounded-lg bg-emerald-600 font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saqlanmoqda..." : saved ? "Saqlandi ✓" : "Saqlash"}
      </button>
    </form>
  );
}

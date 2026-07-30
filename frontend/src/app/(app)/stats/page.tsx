"use client";

import { useState } from "react";

import { PeriodChart } from "@/components/stats/PeriodChart";
import { PeriodToggle } from "@/components/stats/PeriodToggle";
import { PrayerFilterSelect } from "@/components/stats/PrayerFilterSelect";
import { usePrayerTypes } from "@/hooks/usePrayerTypes";
import { useStats } from "@/hooks/useStats";
import type { StatsPeriod } from "@/hooks/useStats";
import type { PrayerCode } from "@/types/prayer";

export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [prayerFilter, setPrayerFilter] = useState<PrayerCode | "all">("all");
  const { data: prayerTypes } = usePrayerTypes();
  const { data: buckets, isLoading } = useStats(period, prayerFilter);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Statistika</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodToggle value={period} onChange={setPeriod} />
        <PrayerFilterSelect
          prayerTypes={prayerTypes?.results ?? []}
          value={prayerFilter}
          onChange={setPrayerFilter}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        {isLoading ? (
          <p className="flex h-64 items-center justify-center text-sm text-neutral-500">
            Yuklanmoqda...
          </p>
        ) : (
          <PeriodChart data={buckets ?? []} />
        )}
      </div>
    </main>
  );
}

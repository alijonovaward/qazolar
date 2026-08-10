"use client";

import { useState } from "react";

import { PeriodChart } from "@/components/stats/PeriodChart";
import { PeriodToggle } from "@/components/stats/PeriodToggle";
import { PrayerFilterSelect } from "@/components/stats/PrayerFilterSelect";
import { RemainingTrendChart } from "@/components/stats/RemainingTrendChart";
import { usePrayerTypes } from "@/hooks/usePrayerTypes";
import { useRemainingTrend, useStats } from "@/hooks/useStats";
import type { StatsPeriod } from "@/hooks/useStats";
import type { PrayerCode } from "@/types/prayer";

export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("day");
  const [prayerFilter, setPrayerFilter] = useState<PrayerCode | "all">("all");
  const { data: prayerTypes } = usePrayerTypes();
  const { data: buckets, isLoading: statsLoading } = useStats(period, prayerFilter);
  const { data: trend, isLoading: trendLoading } = useRemainingTrend(period, prayerFilter);

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

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Qolgan qazo (umumiy qarz)
        </h2>
        {trendLoading ? (
          <p className="flex h-64 items-center justify-center text-sm text-neutral-500">
            Yuklanmoqda...
          </p>
        ) : (
          <RemainingTrendChart data={trend ?? []} />
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Faoliyat</h2>
        {statsLoading ? (
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

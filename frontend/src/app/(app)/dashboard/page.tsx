"use client";

import Link from "next/link";

import { ForecastCard } from "@/components/prayer/ForecastCard";
import { OverallProgressCard } from "@/components/prayer/OverallProgressCard";
import { PrayerRow } from "@/components/prayer/PrayerRow";
import { RecentActivityCard } from "@/components/prayer/RecentActivityCard";
import { StreakBadge } from "@/components/prayer/StreakBadge";
import { useIncrementDailyLog } from "@/hooks/useDailyLog";
import { useForecast } from "@/hooks/useForecast";
import { useMe } from "@/hooks/useMe";
import { useQazoRecords, useQazoSummary } from "@/hooks/useQazoRecords";
import type { DailyLogField, PrayerCode } from "@/types/prayer";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const today = todayISO();
  const { data: me } = useMe();
  const { data: records, isLoading } = useQazoRecords();
  const { data: summary } = useQazoSummary();
  const { data: forecast } = useForecast();
  const increment = useIncrementDailyLog(today);

  if (isLoading) {
    return <p className="text-neutral-500">Yuklanmoqda...</p>;
  }

  const hasSetup = (records?.count ?? 0) > 0;

  function handleTap(prayerType: PrayerCode, field: DailyLogField) {
    increment.mutate({ prayer_type: prayerType, field });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">
        Assalomu alaykum{me ? `, ${me.email}` : ""}
      </h1>

      <StreakBadge />

      {!hasSetup && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
          <p>Hali boshlang&apos;ich sozlash bajarilmagan.</p>
          <Link
            href="/setup"
            className="inline-block w-fit rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white"
          >
            Sozlashni boshlash
          </Link>
        </div>
      )}

      {summary && <OverallProgressCard summary={summary} />}

      {hasSetup && forecast && <ForecastCard forecast={forecast} />}

      {hasSetup && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-neutral-500">
            <span className="font-semibold text-red-600 dark:text-red-400">+</span> qoldirdim ·{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">−</span> o&apos;qidim
          </p>
          {records!.results.map((record) => (
            <PrayerRow
              key={record.prayer_type.code}
              record={record}
              onTap={(field) => handleTap(record.prayer_type.code, field)}
            />
          ))}
        </div>
      )}

      {hasSetup && <RecentActivityCard />}

      {hasSetup && (
        <Link href="/setup" className="text-sm text-emerald-700 underline dark:text-emerald-400">
          Sozlashni tahrirlash
        </Link>
      )}
    </div>
  );
}

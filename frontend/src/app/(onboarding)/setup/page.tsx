"use client";

import Link from "next/link";

import { MenstruationPeriodsSection } from "@/components/setup/MenstruationPeriodsSection";
import { PrayerSetupCard } from "@/components/setup/PrayerSetupCard";
import { useMe } from "@/hooks/useMe";
import { usePrayerTypes } from "@/hooks/usePrayerTypes";
import { useQazoSetups, useUpsertQazoSetup } from "@/hooks/useQazoSetup";

export default function SetupPage() {
  const { data: me } = useMe();
  const { data: prayerTypes, isLoading } = usePrayerTypes();
  const { data: setups } = useQazoSetups();
  const upsert = useUpsertQazoSetup();

  const setupByCode = new Map((setups?.results ?? []).map((s) => [s.prayer_type.code, s]));

  if (isLoading) {
    return <p className="p-4 text-neutral-500">Yuklanmoqda...</p>;
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Boshlang&apos;ich sozlash</h1>
        <Link href="/dashboard" className="text-sm text-emerald-700 underline dark:text-emerald-400">
          Dashboardga o&apos;tish
        </Link>
      </div>
      <p className="text-sm text-neutral-500">
        Har bir namoz vaqti uchun holatingizni belgilang. Keyinroq bu yerga qaytib
        o&apos;zgartirishingiz mumkin.
      </p>

      {prayerTypes?.results.map((prayerType) => (
        <PrayerSetupCard
          key={prayerType.code}
          prayerType={prayerType}
          existing={setupByCode.get(prayerType.code)}
          onSave={(data) => upsert.mutateAsync({ code: prayerType.code, data })}
        />
      ))}

      {me?.gender === "female" && <MenstruationPeriodsSection />}
    </main>
  );
}

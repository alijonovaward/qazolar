"use client";

import Link from "next/link";

import { formatCount } from "@/components/zikr/utils";
import { useZikrList } from "@/hooks/useZikr";

export default function ZikrListPage() {
  const { data: zikrs, isLoading } = useZikrList();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Zikrlar</h1>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : !zikrs?.length ? (
        <p className="text-sm text-neutral-500">Hozircha faol zikr yo&apos;q.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {zikrs.map((zikr) => (
            <Link
              key={zikr.id}
              href={`/zikr/${zikr.id}`}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{zikr.transliteration}</span>
                <span dir="rtl" className="text-lg">
                  {zikr.arabic_text}
                </span>
              </div>
              <p className="text-sm text-neutral-500">{zikr.translation}</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{ width: `${zikr.percent_complete}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {formatCount(zikr.current_count)} / {formatCount(zikr.target_count)}
                </span>
                <span>
                  {zikr.percent_complete}% · {formatCount(zikr.remaining)} qoldi
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

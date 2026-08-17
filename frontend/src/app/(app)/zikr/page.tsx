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
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 8c1.7 0 3 1.3 3 3s-1.3 3-3 3M18.5 14c2.6.4 4.5 1.9 4.5 4"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{formatCount(zikr.participant_count)} ishtirokchi</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

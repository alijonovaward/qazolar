"use client";

import { useUpdateMe } from "@/hooks/useMe";
import type { VisibilityLevel } from "@/types/user";

const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  full: "To'liq (har namoz bo'yicha sonlar)",
  percent_only: "Faqat umumiy foiz va streak",
  none: "Hech narsa",
};

export function VisibilitySelector({ value }: { value: VisibilityLevel | undefined }) {
  const updateMe = useUpdateMe();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Kuzatuvchilarim nima ko&apos;radi
      </h2>
      <div className="relative">
        <select
          value={value ?? "percent_only"}
          onChange={(event) => updateMe.mutate({ follower_visibility: event.target.value as VisibilityLevel })}
          className="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-neutral-300 bg-transparent px-3 pr-9 text-sm font-medium transition-colors hover:border-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:hover:border-neutral-600"
        >
          {(Object.entries(VISIBILITY_LABELS) as [VisibilityLevel, string][]).map(([option, label]) => (
            <option key={option} value={option}>
              {label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

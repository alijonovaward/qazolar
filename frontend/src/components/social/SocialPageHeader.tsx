import Link from "next/link";

import { CountBadge } from "@/components/social/CountBadge";

// A long title + a count badge + a text link all fighting for one row was
// the exact "wraps into a mess" bug we've hit elsewhere — a back-arrow
// button + truncating title + trailing badge is the standard mobile
// pattern instead: fixed-width ends, title takes whatever's left.
export function SocialPageHeader({ title, count }: { title: string; count: number | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/social"
        aria-label="Do'stlarga qaytish"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M15 18 9 12l6-6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
      <CountBadge count={count} />
    </div>
  );
}

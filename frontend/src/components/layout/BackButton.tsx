import Link from "next/link";

export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
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
  );
}

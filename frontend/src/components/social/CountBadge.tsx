export function CountBadge({ count }: { count: number | undefined }) {
  if (count == null) return null;
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
      {count}
    </span>
  );
}

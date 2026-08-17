const PALETTE = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
];

// A stable-per-identity color pick (not random) — the same person always
// gets the same tint across renders/lists, which is what makes a row of
// initials actually helpful for telling people apart at a glance.
function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ label }: { label: string }) {
  const initial = label.replace(/^@/, "")[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${paletteFor(label)}`}
    >
      {initial}
    </span>
  );
}

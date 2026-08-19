// Rough, widely-used rule of thumb for how long praying one rakat takes —
// not a precise number, just enough to turn a raw rakat count into
// something a person can feel ("6 soat" means more than "360 rakat").
const MINUTES_PER_RAKAT = 1;

export function estimatedReadingMinutes(remainingRakats: number): number {
  return remainingRakats * MINUTES_PER_RAKAT;
}

// "42 daqiqa" / "6 soat 20 daqiqa" / "3 kun 4 soat" — drops to the next unit
// down only while it's still worth showing (a "0 daqiqa" remainder is noise
// once we're already talking in days).
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes} daqiqa`;

  const totalHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (totalHours < 24) {
    return remainingMinutes > 0 ? `${totalHours} soat ${remainingMinutes} daqiqa` : `${totalHours} soat`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours > 0 ? `${days} kun ${remainingHours} soat` : `${days} kun`;
}

// "hozir" / "3 daqiqa oldin" / "2 soat oldin" / "5 kun oldin" — coarse on
// purpose, this is a recent-activity list, not a precise audit log.
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hozir";
  if (minutes < 60) return `${minutes} daqiqa oldin`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;

  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

// Same per-prayer palette as PrayerRow's progress bars — a dot in the same
// color lets the recent-activity list read at a glance without repeating
// the prayer name in full each row.
export const PRAYER_COLORS: Record<string, string> = {
  bomdod: "bg-indigo-500",
  peshin: "bg-amber-500",
  asr: "bg-orange-500",
  shom: "bg-rose-500",
  xufton: "bg-sky-600",
  vitr: "bg-violet-600",
};

// Tailwind can't build class names from interpolated strings at build
// time — border-left needs its own literal map, not `border-l-${x}`.
export const PRAYER_BORDER_COLORS: Record<string, string> = {
  bomdod: "border-l-indigo-500",
  peshin: "border-l-amber-500",
  asr: "border-l-orange-500",
  shom: "border-l-rose-500",
  xufton: "border-l-sky-600",
  vitr: "border-l-violet-600",
};

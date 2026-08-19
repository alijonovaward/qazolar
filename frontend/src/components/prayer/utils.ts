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

import type { PrayerCode, PrayerType } from "@/types/prayer";

interface Props {
  prayerTypes: PrayerType[];
  value: PrayerCode | "all";
  onChange: (value: PrayerCode | "all") => void;
}

export function PrayerFilterSelect({ prayerTypes, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as PrayerCode | "all")}
      className="min-h-11 rounded-lg border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
    >
      <option value="all">Barcha namozlar</option>
      {prayerTypes.map((pt) => (
        <option key={pt.code} value={pt.code}>
          {pt.name}
        </option>
      ))}
    </select>
  );
}

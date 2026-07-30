import type { StatsPeriod } from "@/hooks/useStats";

const OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: "day", label: "Kun" },
  { value: "week", label: "Hafta" },
  { value: "month", label: "Oy" },
  { value: "year", label: "Yil" },
];

interface Props {
  value: StatsPeriod;
  onChange: (value: StatsPeriod) => void;
}

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-9 rounded-md px-3 text-sm ${
            value === option.value
              ? "bg-emerald-600 font-medium text-white"
              : "text-neutral-600 dark:text-neutral-400"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

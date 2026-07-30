import type { DailyLog, DailyLogField, QazoRecord } from "@/types/prayer";

const COLORS: Record<string, string> = {
  bomdod: "bg-indigo-500",
  peshin: "bg-amber-500",
  asr: "bg-orange-500",
  shom: "bg-rose-500",
  xufton: "bg-sky-600",
  vitr: "bg-violet-600",
};

interface Props {
  record: QazoRecord;
  todayLog?: DailyLog;
  pending?: boolean;
  onTap: (field: DailyLogField) => void;
}

function BucketRow({
  label,
  missed,
  completed,
  pending,
  onPlus,
  onMinus,
  plusLabel,
  minusLabel,
}: {
  label: string;
  missed: number;
  completed: number;
  pending?: boolean;
  onPlus: () => void;
  onMinus: () => void;
  plusLabel: string;
  minusLabel: string;
}) {
  const remaining = Math.max(missed - completed, 0);
  const nothingLeft = remaining === 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">
        {label}: <span className="text-neutral-900 dark:text-neutral-100">{remaining} / {missed}</span> qoldi
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPlus}
          disabled={pending}
          aria-label={plusLabel}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-red-300 text-base font-semibold text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
        >
          +
        </button>
        <button
          type="button"
          onClick={onMinus}
          disabled={pending || nothingLeft}
          aria-label={minusLabel}
          title={nothingLeft ? "Qolgan qazo yo'q" : undefined}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-300 text-base font-semibold text-emerald-600 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-400"
        >
          −
        </button>
      </div>
    </div>
  );
}

export function PrayerRow({ record, todayLog, pending, onTap }: Props) {
  const color = COLORS[record.prayer_type.code] ?? "bg-emerald-600";
  const name = record.prayer_type.name;

  const todayMissed = (todayLog?.hazar_missed_count ?? 0) + (todayLog?.qasr_missed_count ?? 0);
  const todayCompleted = (todayLog?.hazar_completed_count ?? 0) + (todayLog?.qasr_completed_count ?? 0);

  return (
    <div className="flex flex-col gap-2 border-b border-neutral-100 py-3 last:border-0 dark:border-neutral-800">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-neutral-500">
          {record.remaining_count} / {record.total_missed} qoldi
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${record.percent_complete}%` }}
        />
      </div>

      <BucketRow
        label="Oddiy"
        missed={record.hazar_missed}
        completed={record.hazar_completed}
        pending={pending}
        onPlus={() => onTap("hazar_missed")}
        onMinus={() => onTap("hazar_completed")}
        plusLabel={`${name} bugun oddiy qoldirildi`}
        minusLabel={`${name} oddiy qazosi o'qildi`}
      />
      <BucketRow
        label="Safar"
        missed={record.qasr_missed}
        completed={record.qasr_completed}
        pending={pending}
        onPlus={() => onTap("qasr_missed")}
        onMinus={() => onTap("qasr_completed")}
        plusLabel={`${name} bugun safarda qoldirildi`}
        minusLabel={`${name} safar qazosi o'qildi`}
      />

      <span className="text-xs text-neutral-500">
        Bugun: {todayMissed} qoldirildi · {todayCompleted} o&apos;qildi
      </span>
    </div>
  );
}

import type { DailyLogField, QazoRecord } from "@/types/prayer";

import { PRAYER_BORDER_COLORS, PRAYER_COLORS } from "./utils";

interface Props {
  record: QazoRecord;
  onTap: (field: DailyLogField) => void;
}

function TapButtons({
  missed,
  completed,
  onPlus,
  onMinus,
  plusLabel,
  minusLabel,
}: {
  missed: number;
  completed: number;
  onPlus: () => void;
  onMinus: () => void;
  plusLabel: string;
  minusLabel: string;
}) {
  const nothingLeft = Math.max(missed - completed, 0) === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPlus}
        aria-label={plusLabel}
        className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-red-300 text-base font-semibold text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
      >
        +
      </button>
      <button
        type="button"
        onClick={onMinus}
        disabled={nothingLeft}
        aria-label={minusLabel}
        title={nothingLeft ? "Qolgan qazo yo'q" : undefined}
        className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-300 text-base font-semibold text-emerald-600 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-400"
      >
        −
      </button>
    </div>
  );
}

function BucketRow(
  props: {
    label: string;
    missed: number;
    completed: number;
  } & Parameters<typeof TapButtons>[0]
) {
  const remaining = Math.max(props.missed - props.completed, 0);
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">
        {props.label}:{" "}
        <span className="text-neutral-900 dark:text-neutral-100">
          {remaining} / {props.missed}
        </span>{" "}
        qoldi
      </span>
      <TapButtons {...props} />
    </div>
  );
}

export function PrayerRow({ record, onTap }: Props) {
  const color = PRAYER_COLORS[record.prayer_type.code] ?? "bg-emerald-600";
  const borderColor = PRAYER_BORDER_COLORS[record.prayer_type.code] ?? "border-l-emerald-600";
  const name = record.prayer_type.name;
  // Bomdod/Shom/Vitr don't shorten under safar (qasr rakat count == hazar
  // rakat count) — a separate "safar" bucket is meaningless there, so a
  // single +/- pair covers the whole prayer instead of two labeled rows.
  const hasQasrBucket = record.prayer_type.qasr_rakat_count !== record.prayer_type.rakat_count;

  return (
    // Its own bordered card, not just a bottom-border list row — a thin
    // divider line reads as "barely there" once you're scanning fast for
    // *which* prayer's +/- you're about to tap. The colored left edge
    // matches this prayer's color everywhere else in the app (progress
    // bar, charts), so it's identifiable without reading the label first.
    <div
      className={`flex flex-col gap-1.5 rounded-xl border border-neutral-200 border-l-4 p-3 dark:border-neutral-800 ${borderColor}`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        {/* Same percent followers see on FolloweeProfileView's MiniPrayerRow
            — shown here too so it's not something you only see through
            someone else's eyes. */}
        <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {record.percent_complete}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${record.percent_complete}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {record.remaining_count} / {record.total_missed} qoldi
      </p>

      {hasQasrBucket ? (
        <>
          <BucketRow
            label="Oddiy"
            missed={record.hazar_missed}
            completed={record.hazar_completed}
            onPlus={() => onTap("hazar_missed")}
            onMinus={() => onTap("hazar_completed")}
            plusLabel={`${name} bugun oddiy qoldirildi`}
            minusLabel={`${name} oddiy qazosi o'qildi`}
          />
          <BucketRow
            label="Safar"
            missed={record.qasr_missed}
            completed={record.qasr_completed}
            onPlus={() => onTap("qasr_missed")}
            onMinus={() => onTap("qasr_completed")}
            plusLabel={`${name} bugun safarda qoldirildi`}
            minusLabel={`${name} safar qazosi o'qildi`}
          />
        </>
      ) : (
        <div className="flex justify-end">
          <TapButtons
            missed={record.hazar_missed}
            completed={record.hazar_completed}
            onPlus={() => onTap("hazar_missed")}
            onMinus={() => onTap("hazar_completed")}
            plusLabel={`${name} bugun qoldirildi`}
            minusLabel={`${name} qazosi o'qildi`}
          />
        </div>
      )}
    </div>
  );
}

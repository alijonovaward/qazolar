import type { QazoSummary } from "@/types/prayer";

export function OverallProgressCard({ summary }: { summary: QazoSummary }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Umumiy progress</h2>
        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {summary.percent_complete}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-emerald-600 transition-all"
          style={{ width: `${summary.percent_complete}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {summary.total_completed} / {summary.total_missed} qazo yopildi · {summary.remaining_rakats}{" "}
        rakat qoldi
      </p>
    </div>
  );
}

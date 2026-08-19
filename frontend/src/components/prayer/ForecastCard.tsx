import type { Forecast } from "@/types/prayer";

import { estimatedReadingMinutes, formatDuration } from "./utils";

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </div>
  );
}

export function ForecastCard({ forecast }: { forecast: Forecast }) {
  const hasRate = forecast.daily_rakat_rate > 0 && forecast.forecast_days_remaining !== null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="font-semibold">Prognoz</h2>
      <div className="flex flex-wrap gap-3">
        <StatTile
          label="Kunlik tezlik"
          value={`${forecast.daily_rakat_rate.toFixed(1)} rakat`}
          hint="so'nggi 7 kun"
        />
        <StatTile
          label="Necha kunda tugaydi"
          value={hasRate ? `${Math.round(forecast.forecast_days_remaining!)} kun` : "—"}
          hint={
            hasRate && forecast.forecast_years_remaining !== null
              ? `≈ ${forecast.forecast_years_remaining} yil`
              : "hali ma'lumot yetarli emas"
          }
        />
        {/* Sof o'qish vaqti — kalendar prognozdan farqli, tinmay o'qilsa
            ketadigan vaqt (taxminan 1 rakat = 1 daqiqa). */}
        <StatTile
          label="Jami o'qish vaqti"
          value={formatDuration(estimatedReadingMinutes(forecast.remaining_rakats))}
          hint="tinmay o'qisangiz"
        />
      </div>
    </div>
  );
}

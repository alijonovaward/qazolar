export type PrayerCode = "bomdod" | "peshin" | "asr" | "shom" | "xufton" | "vitr";

export interface PrayerType {
  code: PrayerCode;
  name: string;
  order: number;
  rakat_count: number;
  qasr_rakat_count: number;
}

export type SetupStatus = "consistent" | "owes_qazo";

export interface InitialQazoSetup {
  prayer_type: PrayerType;
  status: SetupStatus;
  hazar_manual_override_count: number | null;
  qasr_manual_override_count: number | null;
  updated_at: string;
}

export interface QazoSetupPayload {
  status: SetupStatus;
  hazar_manual_override_count: number | null;
  qasr_manual_override_count: number | null;
}

export interface QazoRecord {
  prayer_type: PrayerType;
  hazar_missed: number;
  hazar_completed: number;
  qasr_missed: number;
  qasr_completed: number;
  total_missed: number;
  total_completed: number;
  remaining_count: number;
  remaining_hazar: number;
  remaining_qasr: number;
  percent_complete: number;
  updated_at: string;
}

export interface QazoSummary {
  total_missed: number;
  total_completed: number;
  percent_complete: number;
  remaining_rakats: number;
}

export interface DailyLog {
  id: number;
  prayer_type: PrayerType;
  date: string;
  hazar_missed_count: number;
  hazar_completed_count: number;
  qasr_missed_count: number;
  qasr_completed_count: number;
  updated_at: string;
}

export type DailyLogField = "hazar_missed" | "hazar_completed" | "qasr_missed" | "qasr_completed";

export interface DailyLogIncrementPayload {
  prayer_type: PrayerCode;
  date: string;
  field: DailyLogField;
}

export interface DailyGoal {
  date: string;
  target_count: number;
}

export interface Forecast {
  daily_rakat_rate: number;
  remaining_rakats: number;
  forecast_days_remaining: number | null;
  forecast_years_remaining: number | null;
}

export interface TapLog {
  id: number;
  prayer_type: PrayerType;
  field: DailyLogField;
  field_display: string;
  created_at: string;
}

export interface MenstruationPeriod {
  id: number;
  start_date: string;
  end_date: string | null;
}

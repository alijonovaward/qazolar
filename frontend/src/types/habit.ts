import type { Contributor } from "@/types/social";

export interface Habit {
  id: number;
  name: string;
  unit: string;
  daily_target: number | null;
  is_active: boolean;
  today_amount: number;
  percent_complete: number | null;
  current_streak: number;
  created_at: string;
}

export interface HabitCreatePayload {
  name: string;
  unit: string;
  daily_target: number | null;
}

export interface HabitLogEntry {
  date: string;
  amount: number;
}

// 2-bosqich: admin-curated, hammaga ochiq — apps.zikr.Zikr bilan bir xil
// jamoaviy-hisoblagich shakli, faqat dhikr-ga xos bo'lmagan har qanday
// umumiy vazifa uchun.
export interface CollectiveHabit {
  id: number;
  name: string;
  unit: string;
  target_count: number;
  current_count: number;
  percent_complete: number;
  remaining: number;
  participant_count: number;
  my_count: number;
  top_contributors: Contributor[];
  created_at: string;
  completed_at: string | null;
  duration_days: number | null;
}

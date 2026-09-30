import type { Contributor, MiniUser } from "@/types/social";

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

// 3-bosqich: foydalanuvchi yaratgan, faqat taklif qilingan/link orqali
// qo'shilganlar ko'radigan jamoaviy vazifa — CollectiveHabit'dan farqli,
// hech qachon umumiy ro'yxatda emas.
export interface SharedHabit {
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
  is_creator: boolean;
  invite_token: string;
  created_at: string;
  completed_at: string | null;
  duration_days: number | null;
}

export interface SharedHabitCreatePayload {
  name: string;
  unit: string;
  target_count: number;
}

export interface SharedHabitInvite {
  id: number;
  shared_habit: { id: number; name: string };
  invited_by: MiniUser;
  invitee: MiniUser;
  created_at: string;
}

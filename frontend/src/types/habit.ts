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

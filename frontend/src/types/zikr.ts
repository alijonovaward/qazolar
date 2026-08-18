export interface Zikr {
  id: number;
  arabic_text: string;
  transliteration: string;
  translation: string;
  target_count: number;
  current_count: number;
  percent_complete: number;
  remaining: number;
  participant_count: number;
  my_count: number;
  created_at: string;
  completed_at: string | null;
  duration_days: number | null;
}

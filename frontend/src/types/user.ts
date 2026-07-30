export type Gender = "male" | "female" | "unspecified";

export interface User {
  id: number;
  email: string;
  gender: Gender;
  birth_date: string | null;
  created_at: string;
}

export type Gender = "male" | "female" | "unspecified";
export type VisibilityLevel = "full" | "percent_only" | "none";

export interface User {
  id: number;
  email: string;
  username: string | null;
  gender: Gender;
  birth_date: string | null;
  follower_visibility: VisibilityLevel;
  created_at: string;
}

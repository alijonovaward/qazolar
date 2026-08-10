import type { QazoRecord } from "@/types/prayer";
import type { VisibilityLevel } from "@/types/user";

export type FollowStatus = "pending" | "accepted";

export interface MiniUser {
  id: number;
  username: string | null;
  email: string;
}

export interface FollowRelation {
  id: number;
  follower: MiniUser;
  followee: MiniUser;
  status: FollowStatus;
  created_at: string;
}

export interface FolloweeProfile {
  visibility: VisibilityLevel;
  percent_complete?: number;
  current_streak?: number;
  records?: QazoRecord[];
}

export interface FollowingRelation extends FollowRelation {
  followee_profile: FolloweeProfile;
}

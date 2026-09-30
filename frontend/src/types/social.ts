import type { QazoRecord } from "@/types/prayer";
import type { VisibilityLevel } from "@/types/user";

export type FollowStatus = "pending" | "accepted";

export interface MiniUser {
  id: number;
  username: string | null;
  nickname: string | null;
  email: string;
}

// One user's rank in a collective-counter leaderboard — shared by
// apps.zikr's Zikr and apps.habits' CollectiveHabit, both of which expose
// the exact same {user, count} shape for their top_contributors field.
export interface Contributor {
  user: MiniUser;
  count: number;
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

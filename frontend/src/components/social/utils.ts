import type { MiniUser } from "@/types/social";

// nickname (purely cosmetic, no format/uniqueness rules) beats @username
// (the technical follow/invite handle) beats email (the last-resort
// fallback, and the one worth avoiding in front of strangers — e.g. an
// open collective-habit leaderboard — since it's the one identity-bearing
// piece nobody chose to share for that purpose).
export function displayName(user: MiniUser) {
  if (user.nickname) return user.nickname;
  if (user.username) return `@${user.username}`;
  return user.email;
}

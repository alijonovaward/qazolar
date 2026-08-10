import type { MiniUser } from "@/types/social";

export function displayName(user: MiniUser) {
  return user.username ? `@${user.username}` : user.email;
}

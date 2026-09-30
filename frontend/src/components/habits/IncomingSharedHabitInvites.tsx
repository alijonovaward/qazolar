"use client";

import { Avatar } from "@/components/social/Avatar";
import { displayName } from "@/components/social/utils";
import {
  useAcceptSharedHabitInvite,
  useIncomingSharedHabitInvites,
  useRemoveSharedHabitInvite,
} from "@/hooks/useHabits";

// Same "kelgan so'rovlar" shape as /social's incoming follow requests —
// this is the only way an invitee ever learns about a shared habit, since
// nothing else surfaces it (it's never in any public/open list).
export function IncomingSharedHabitInvites() {
  const { data: invites } = useIncomingSharedHabitInvites();
  const accept = useAcceptSharedHabitInvite();
  const decline = useRemoveSharedHabitInvite();

  if (!invites?.length) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Kelgan takliflar
      </h2>
      <ul className="flex flex-col gap-3">
        {invites.map((invite) => (
          <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar label={displayName(invite.invited_by)} />
              <span className="min-w-0 truncate text-sm">
                {displayName(invite.invited_by)} — <span className="font-medium">{invite.shared_habit.name}</span>
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => accept.mutate(invite.id)}
                disabled={accept.isPending}
                className="min-h-9 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Qabul qilish
              </button>
              <button
                type="button"
                onClick={() => decline.mutate(invite.id)}
                disabled={decline.isPending}
                className="min-h-9 rounded-full border border-neutral-300 px-3 text-xs dark:border-neutral-700"
              >
                Rad etish
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

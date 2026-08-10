import type { FolloweeProfile } from "@/types/social";

export function FolloweeProfileView({ profile }: { profile: FolloweeProfile }) {
  if (profile.visibility === "none") {
    return <p className="text-xs text-neutral-500">Ma&apos;lumotni ko&apos;rsatishni yoqmagan.</p>;
  }
  return (
    <div className="flex flex-col gap-1 text-xs text-neutral-500">
      <p>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {profile.percent_complete}%
        </span>{" "}
        bajarilgan · {profile.current_streak} kunlik streak
      </p>
      {profile.visibility === "full" && profile.records && (
        <ul className="flex flex-col gap-0.5">
          {profile.records.map((record) => (
            <li key={record.prayer_type.code}>
              {record.prayer_type.name}: {record.remaining_count} / {record.total_missed} qoldi
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

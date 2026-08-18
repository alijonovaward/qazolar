import { CountBadge } from "@/components/social/CountBadge";
import { BackButton } from "@/components/layout/BackButton";

// A long title + a count badge + a text link all fighting for one row was
// the exact "wraps into a mess" bug we've hit elsewhere — a back-arrow
// button + truncating title + trailing badge is the standard mobile
// pattern instead: fixed-width ends, title takes whatever's left.
export function SocialPageHeader({ title, count }: { title: string; count: number | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <BackButton href="/social" label="Do'stlarga qaytish" />
      <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
      <CountBadge count={count} />
    </div>
  );
}

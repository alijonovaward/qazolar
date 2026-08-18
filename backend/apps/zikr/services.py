from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User

from .models import UserZikrCount, Zikr

# A single sync call is a client-batched delta from ~10 seconds of tapping —
# no honest user gets anywhere close to this in that window. It's just a
# sanity ceiling against a scripted/spammed request, not a real usage limit.
MAX_SYNC_DELTA = 5000


def sync_zikr_count(user: User, zikr: Zikr, delta: int) -> Zikr:
    """Add `delta` taps to both the collective Zikr total and this user's own
    running contribution, atomically. Cumulative on both sides — never a
    blind overwrite — so concurrent syncs (e.g. two open tabs) just add up
    instead of racing each other.

    Never lets the collective total pass target_count — once the goal is
    reached, nobody (this user included) can add any more, and the excess
    from a batch that crosses the line is simply dropped, not credited to
    anyone."""
    delta = max(min(delta, MAX_SYNC_DELTA), 0)
    if delta == 0:
        return zikr

    with transaction.atomic():
        locked = Zikr.objects.select_for_update().get(pk=zikr.pk)
        capacity = max(locked.target_count - locked.current_count, 0)
        delta = min(delta, capacity)
        if delta == 0:
            return locked

        locked.current_count += delta
        update_fields = ["current_count", "updated_at"]
        # First time crossing the line, not every sync after — completed_at
        # marks the moment the goal was reached, so it's set once and left
        # alone even though current_count can't move past target_count again.
        if locked.completed_at is None and locked.current_count >= locked.target_count:
            locked.completed_at = timezone.now()
            update_fields.append("completed_at")
        locked.save(update_fields=update_fields)

        user_count, _created = UserZikrCount.objects.select_for_update().get_or_create(
            user=user, zikr=locked
        )
        user_count.count += delta
        user_count.save(update_fields=["count", "updated_at"])

    return locked

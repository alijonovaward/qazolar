from django.db import transaction

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
    instead of racing each other."""
    delta = max(min(delta, MAX_SYNC_DELTA), 0)
    if delta == 0:
        return zikr

    with transaction.atomic():
        locked = Zikr.objects.select_for_update().get(pk=zikr.pk)
        locked.current_count += delta
        locked.save(update_fields=["current_count", "updated_at"])

        user_count, _created = UserZikrCount.objects.select_for_update().get_or_create(
            user=user, zikr=locked
        )
        user_count.count += delta
        user_count.save(update_fields=["count", "updated_at"])

    return locked

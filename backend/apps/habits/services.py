from datetime import date as date_type, timedelta

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User

from .models import (
    CollectiveHabit,
    Habit,
    HabitLog,
    SharedHabit,
    SharedHabitMember,
    UserCollectiveHabitCount,
)

# Same reasoning as apps.zikr.services.MAX_SYNC_DELTA — a sanity ceiling
# against a scripted/spammed request, not a real usage limit.
MAX_COLLECTIVE_DELTA = 5000


def _sync_capped_counter(delta: int, locked, member_model, member_fk_field: str, user: User):
    """Shared body of sync_collective_habit and sync_shared_habit — both are
    'cumulative shared total, capped at target, completed_at set once' over
    a locked row, differing only in which member model tracks the per-user
    contribution and what it calls its parent FK."""
    delta = max(min(delta, MAX_COLLECTIVE_DELTA), 0)
    if delta == 0:
        return locked

    capacity = max(locked.target_count - locked.current_count, 0)
    delta = min(delta, capacity)
    if delta == 0:
        return locked

    locked.current_count += delta
    update_fields = ["current_count", "updated_at"]
    if locked.completed_at is None and locked.current_count >= locked.target_count:
        locked.completed_at = timezone.now()
        update_fields.append("completed_at")
    locked.save(update_fields=update_fields)

    member, _created = member_model.objects.select_for_update().get_or_create(
        user=user, **{member_fk_field: locked}
    )
    member.count += delta
    member.save(update_fields=["count", "updated_at"])

    return locked


def add_habit_progress(habit: Habit, date: date_type, amount: int) -> HabitLog:
    """+amount to today's tally for this habit, atomically — cumulative
    across repeated add-ins in the same day (ertalab +10, peshinda +10 ->
    kunlik jami 20), never a blind overwrite of "today's total"."""
    with transaction.atomic():
        log, _created = HabitLog.objects.select_for_update().get_or_create(habit=habit, date=date)
        log.amount += amount
        log.save(update_fields=["amount", "updated_at"])
    return log


TREND_WINDOW_DAYS = 14


def habit_trend(habit: Habit, window_days: int = TREND_WINDOW_DAYS) -> list[dict]:
    """Last `window_days` days, oldest first, one entry per calendar day —
    days with no log are zero-filled (not skipped), so a bar chart shows a
    real, continuous week/fortnight instead of bars jammed together
    wherever activity happened to occur."""
    today = timezone.localdate()
    window_start = today - timedelta(days=window_days - 1)
    amounts_by_date = dict(
        HabitLog.objects.filter(habit=habit, date__gte=window_start, date__lte=today).values_list(
            "date", "amount"
        )
    )
    return [
        {
            "date": (window_start + timedelta(days=offset)).isoformat(),
            "amount": amounts_by_date.get(window_start + timedelta(days=offset), 0),
        }
        for offset in range(window_days)
    ]


def sync_collective_habit(user: User, collective_habit: CollectiveHabit, delta: int) -> CollectiveHabit:
    """Same shape as apps.zikr.services.sync_zikr_count — cumulative on both
    the shared total and this user's own contribution, capped at
    target_count, completed_at set once the first time it's reached."""
    with transaction.atomic():
        locked = CollectiveHabit.objects.select_for_update().get(pk=collective_habit.pk)
        return _sync_capped_counter(delta, locked, UserCollectiveHabitCount, "collective_habit", user)


def create_shared_habit(creator: User, name: str, unit: str, target_count: int) -> SharedHabit:
    """The creator is a member from the start — see SharedHabitListCreateView,
    which lists 'everything I'm a member of', not 'everything I created'."""
    with transaction.atomic():
        shared_habit = SharedHabit.objects.create(
            creator=creator, name=name, unit=unit, target_count=target_count
        )
        SharedHabitMember.objects.create(shared_habit=shared_habit, user=creator)
    return shared_habit


def sync_shared_habit(user: User, shared_habit: SharedHabit, delta: int) -> SharedHabit:
    """Same cumulative/capped pattern as sync_collective_habit — the caller
    (see views.SharedHabitSyncView) has already checked membership; this
    just does the counting."""
    with transaction.atomic():
        locked = SharedHabit.objects.select_for_update().get(pk=shared_habit.pk)
        return _sync_capped_counter(delta, locked, SharedHabitMember, "shared_habit", user)


def join_shared_habit(user: User, shared_habit: SharedHabit) -> SharedHabitMember:
    """Idempotent — joining twice (e.g. clicking an already-used link) just
    returns the existing membership rather than erroring."""
    member, _created = SharedHabitMember.objects.get_or_create(shared_habit=shared_habit, user=user)
    return member


def habit_streak(habit: Habit) -> int:
    """Consecutive days (ending today) with any logged amount > 0 — same
    convention as apps.prayers.services.forecast.current_streak (any
    activity counts, not "hit the daily_target")."""
    today = timezone.localdate()
    active_dates = set(
        HabitLog.objects.filter(habit=habit, amount__gt=0).values_list("date", flat=True)
    )
    streak = 0
    day = today
    while day in active_dates:
        streak += 1
        day -= timedelta(days=1)
    return streak

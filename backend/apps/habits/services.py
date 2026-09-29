from datetime import date as date_type, timedelta

from django.db import transaction
from django.utils import timezone

from .models import Habit, HabitLog


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

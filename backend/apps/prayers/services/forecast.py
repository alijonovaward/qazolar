from datetime import timedelta

from django.db.models import F
from django.utils import timezone

from apps.accounts.models import User

from ..models import DailyLog, QazoRecord

DEFAULT_WINDOW_DAYS = 30


def daily_rakat_rate(user: User, window_days: int = DEFAULT_WINDOW_DAYS) -> float:
    """Rakats completed per calendar day over the trailing window (not just active
    days) — avoids one big catch-up day inflating the rate. Hazar and qasr
    completions are each valued at their own rakat count, never a per-prayer
    special case."""
    today = timezone.localdate()
    window_start = today - timedelta(days=window_days - 1)
    logs = DailyLog.objects.filter(
        user=user, date__gte=window_start, date__lte=today
    ).select_related("prayer_type")
    total_rakats = sum(
        log.hazar_completed_count * log.prayer_type.rakat_count
        + log.qasr_completed_count * log.prayer_type.qasr_rakat_count
        for log in logs
    )
    return total_rakats / window_days


def remaining_rakats(user: User) -> int:
    """Outstanding qazo debt, each bucket valued at its own rakat count — hazar
    debt at the full rakat count, qasr debt (missed while travelling) at the
    shortened qasr count, since that's what paying it off will actually take."""
    records = QazoRecord.objects.filter(user=user).select_related("prayer_type")
    return sum(
        record.remaining_hazar * record.prayer_type.rakat_count
        + record.remaining_qasr * record.prayer_type.qasr_rakat_count
        for record in records
    )


def forecast_days_remaining(
    user: User, window_days: int = DEFAULT_WINDOW_DAYS
) -> float | None:
    rate = daily_rakat_rate(user, window_days)
    if rate <= 0:
        return None
    return remaining_rakats(user) / rate


def current_streak(user: User) -> int:
    today = timezone.localdate()
    active_dates = set(
        DailyLog.objects.filter(user=user)
        .annotate(completed=F("hazar_completed_count") + F("qasr_completed_count"))
        .filter(completed__gt=0)
        .values_list("date", flat=True)
        .distinct()
    )
    streak = 0
    day = today
    while day in active_dates:
        streak += 1
        day -= timedelta(days=1)
    return streak

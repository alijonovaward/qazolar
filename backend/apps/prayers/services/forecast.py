from datetime import timedelta

from django.db.models import F, Sum
from django.utils import timezone

from apps.accounts.models import User

from ..models import DailyLog, QazoRecord

# A 30-day average diluted the rate too much for it to feel relevant — one
# active day out of 30 gives a rate 1/30th of what the user actually just
# did, making "necha kunda tugaydi" balloon into an absurd number of days.
# 7 days still smooths out a single big catch-up day (the reason for
# averaging over calendar days at all — see daily_rakat_rate below) without
# burying recent effort under a month of history.
DEFAULT_WINDOW_DAYS = 7


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
    """Consecutive days (ending today) where the remaining qazo rakat total
    strictly *decreased* from the day before — not just "logged something".
    Completing 1 rakat's worth while also logging 5 new missed rakats the
    same day leaves you further behind than yesterday, not caught up, so
    that day can't extend a streak; a day with no net change (e.g. a +1/-1
    on the same prayer) is the same story. Only a real net pay-down counts,
    matching remaining_rakats' rakat-weighting (a Peshin qazo isn't the same
    "amount" as a Bomdod qazo)."""
    today = timezone.localdate()
    net_rakats_by_date = {
        row["date"]: row["net_change"] or 0
        for row in (
            DailyLog.objects.filter(user=user)
            .values("date")
            .annotate(
                net_change=Sum(
                    F("hazar_completed_count") * F("prayer_type__rakat_count")
                    + F("qasr_completed_count") * F("prayer_type__qasr_rakat_count")
                    - F("hazar_missed_count") * F("prayer_type__rakat_count")
                    - F("qasr_missed_count") * F("prayer_type__qasr_rakat_count")
                )
            )
        )
    }
    streak = 0
    day = today
    while net_rakats_by_date.get(day, 0) > 0:
        streak += 1
        day -= timedelta(days=1)
    return streak

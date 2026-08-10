from datetime import date, timedelta

from django.db.models import F, Sum
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek, TruncYear
from django.utils import timezone

from apps.accounts.models import User

from ..models import DailyLog, QazoRecord

TRUNC_FUNCS = {"day": TruncDay, "week": TruncWeek, "month": TruncMonth, "year": TruncYear}

# "Qolgan qazo" (remaining-debt) trend chart: each tab is a fixed trailing
# window, not "everything since the user's first log" — a long history would
# otherwise squash a handful of recent +/- taps into an invisible wiggle.
# "year" buckets by week (not year) so it still resolves to ~52 readable
# points instead of one giant blob per calendar year.
TREND_WINDOWS = {
    "day": {"window_days": 14, "granularity": "day"},
    "week": {"window_days": 7, "granularity": "day"},
    "month": {"window_days": 30, "granularity": "day"},
    "year": {"window_days": 365, "granularity": "week"},
}


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())  # Monday — matches Django's TruncWeek


def _month_start(d: date) -> date:
    return d.replace(day=1)


def _year_start(d: date) -> date:
    return d.replace(month=1, day=1)


def _next_day(d: date) -> date:
    return d + timedelta(days=1)


def _next_week(d: date) -> date:
    return d + timedelta(days=7)


def _next_month(d: date) -> date:
    return date(d.year + 1, 1, 1) if d.month == 12 else date(d.year, d.month + 1, 1)


def _next_year(d: date) -> date:
    return date(d.year + 1, 1, 1)


_BUCKET_START = {"day": lambda d: d, "week": _week_start, "month": _month_start, "year": _year_start}
_BUCKET_NEXT = {"day": _next_day, "week": _next_week, "month": _next_month, "year": _next_year}


def _bucket_sequence(period: str, start: date, end: date) -> list[date]:
    """Every bucket start date from `start` to `end` inclusive, with no gaps —
    e.g. every single day, or every Monday, between the two."""
    start_fn = _BUCKET_START[period]
    next_fn = _BUCKET_NEXT[period]
    current = start_fn(start)
    end_bucket = start_fn(end)
    sequence = []
    while current <= end_bucket:
        sequence.append(current)
        current = next_fn(current)
    return sequence


def remaining_trend(user: User, period: str, prayer_type_code: str = "all") -> list[dict]:
    """Total remaining qazo count as of the end of every bucket in a fixed
    trailing window (see TREND_WINDOWS) — a *continuous* series (gaps between
    active buckets are carried forward flat, not skipped) so the chart shows
    the real shape of the debt over the window, not just a line jumping
    between a couple of far-apart active buckets — and not squashed flat by
    unrelated history outside the window."""
    config = TREND_WINDOWS[period]
    granularity = config["granularity"]
    trunc_fn = TRUNC_FUNCS[granularity]

    today = timezone.localdate()
    window_start = today - timedelta(days=config["window_days"] - 1)

    records = QazoRecord.objects.filter(user=user)
    logs = DailyLog.objects.filter(user=user)
    if prayer_type_code != "all":
        records = records.filter(prayer_type__code=prayer_type_code)
        logs = logs.filter(prayer_type__code=prayer_type_code)

    current_remaining = sum(r.remaining_count for r in records)

    activity_buckets = list(
        logs.filter(date__gte=window_start, date__lte=today)
        .annotate(bucket=trunc_fn("date"))
        .values("bucket")
        .annotate(
            missed=Sum(F("hazar_missed_count") + F("qasr_missed_count")),
            completed=Sum(F("hazar_completed_count") + F("qasr_completed_count")),
        )
        .order_by("bucket")
    )

    # Walk backward from the live total to recover remaining-as-of-end for
    # every bucket that actually has logged activity within the window. Any
    # activity outside the window is already baked into current_remaining, so
    # it's never touched here — that's what keeps the window's shape honest.
    remaining_at = {}
    running = current_remaining
    for bucket in reversed(activity_buckets):
        remaining_at[bucket["bucket"]] = running
        net_change = (bucket["missed"] or 0) - (bucket["completed"] or 0)
        running -= net_change
    remaining_before_window = running

    # Fill every bucket across the whole window (no logged activity = value
    # unchanged from the previous bucket) so the series is continuous, even
    # if nothing happened in it (flat line at the current total).
    full_sequence = _bucket_sequence(granularity, window_start, today)

    series = []
    value = remaining_before_window
    for bucket_date in full_sequence:
        if bucket_date in remaining_at:
            value = remaining_at[bucket_date]
        series.append({"bucket": bucket_date, "remaining": value})

    return series

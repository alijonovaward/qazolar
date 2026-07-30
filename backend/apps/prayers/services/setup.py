from django.db.models import Sum

from ..models import DailyLog, InitialQazoSetup, QazoRecord


def compute_initial_missed_count(setup: InitialQazoSetup) -> int:
    if setup.status == InitialQazoSetup.Status.CONSISTENT:
        return 0
    # No exact number given either — most people don't know it — so start at
    # 0 and let the dashboard's "+" button track misses going forward.
    return setup.manual_override_count or 0


def apply_setup(setup: InitialQazoSetup) -> QazoRecord:
    """Recompute hazar_missed from the setup (the historical debt — setup never
    asks about travel, so it's always hazar) plus every day-to-day hazar miss
    logged since (via the dashboard's "+" button) — re-running this (e.g. the
    user edits their setup later) must not wipe out misses logged in the
    meantime. Never touches *_completed or qasr_missed — those are owned
    exclusively by the daily-log service."""
    base_missed = compute_initial_missed_count(setup)
    logged_missed = (
        DailyLog.objects.filter(user=setup.user, prayer_type=setup.prayer_type).aggregate(
            total=Sum("hazar_missed_count")
        )["total"]
        or 0
    )
    record, _ = QazoRecord.objects.update_or_create(
        user=setup.user,
        prayer_type=setup.prayer_type,
        defaults={"hazar_missed": base_missed + logged_missed},
    )
    return record

from django.db.models import Sum

from ..models import DailyLog, InitialQazoSetup, QazoRecord


def compute_initial_missed_counts(setup: InitialQazoSetup) -> tuple[int, int]:
    """Returns (hazar, qasr) initial debt. 'Qoldirmayman' means neither is owed;
    otherwise each bucket uses its own optional number — most people don't know
    an exact count, so an unset bucket just starts at 0 and is tracked from
    here on via the dashboard's "+" button."""
    if setup.status == InitialQazoSetup.Status.CONSISTENT:
        return 0, 0
    return setup.hazar_manual_override_count or 0, setup.qasr_manual_override_count or 0


def apply_setup(setup: InitialQazoSetup) -> QazoRecord:
    """Recompute hazar_missed/qasr_missed from the setup (the historical debt)
    plus every day-to-day miss logged since (via the dashboard's "+" button) —
    re-running this (e.g. the user edits their setup later) must not wipe out
    misses logged in the meantime. Never touches *_completed — that's owned
    exclusively by the daily-log service."""
    base_hazar, base_qasr = compute_initial_missed_counts(setup)
    logged = DailyLog.objects.filter(user=setup.user, prayer_type=setup.prayer_type).aggregate(
        hazar=Sum("hazar_missed_count"), qasr=Sum("qasr_missed_count")
    )
    record, _ = QazoRecord.objects.update_or_create(
        user=setup.user,
        prayer_type=setup.prayer_type,
        defaults={
            "hazar_missed": base_hazar + (logged["hazar"] or 0),
            "qasr_missed": base_qasr + (logged["qasr"] or 0),
        },
    )
    return record

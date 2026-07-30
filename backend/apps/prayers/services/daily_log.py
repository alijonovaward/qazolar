from datetime import date as date_type
from typing import Literal

from django.db import transaction

from apps.accounts.models import User

from ..models import DailyLog, PrayerType, QazoRecord

Bucket = Literal["hazar_missed", "hazar_completed", "qasr_missed", "qasr_completed"]


def increment_daily_log(
    user: User,
    prayer_type: PrayerType,
    date: date_type,
    field: Bucket,
) -> DailyLog:
    """+1 to today's tally for one bucket, atomically, and the same +1 to the
    matching QazoRecord total. This is what the dashboard's tap-to-record +/-
    buttons call — no client-side state tracking, no read-then-write race.

    Hazar and qasr are separate buckets: a prayer missed while travelling
    still owes a qasr qada once the trip is over, so the two debts (and their
    pay-downs) are tracked independently, never merged.

    A "*_completed" tap is a no-op once that bucket's debt reaches 0 — you
    can't pray off qazo you don't owe."""
    with transaction.atomic():
        record, _ = QazoRecord.objects.select_for_update().get_or_create(
            user=user, prayer_type=prayer_type
        )
        log, _created = DailyLog.objects.select_for_update().get_or_create(
            user=user, prayer_type=prayer_type, date=date
        )

        if field == "hazar_missed":
            log.hazar_missed_count += 1
            record.hazar_missed += 1
        elif field == "hazar_completed":
            if record.hazar_completed < record.hazar_missed:
                log.hazar_completed_count += 1
                record.hazar_completed += 1
        elif field == "qasr_missed":
            log.qasr_missed_count += 1
            record.qasr_missed += 1
        elif field == "qasr_completed":
            if record.qasr_completed < record.qasr_missed:
                log.qasr_completed_count += 1
                record.qasr_completed += 1

        log.save(
            update_fields=[
                "hazar_missed_count",
                "hazar_completed_count",
                "qasr_missed_count",
                "qasr_completed_count",
                "updated_at",
            ]
        )
        record.save(
            update_fields=["hazar_missed", "hazar_completed", "qasr_missed", "qasr_completed", "updated_at"]
        )

    return log

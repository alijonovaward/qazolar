from apps.accounts.models import User
from apps.prayers.models import QazoRecord
from apps.prayers.serializers import QazoRecordSerializer
from apps.prayers.services.forecast import current_streak


def visible_profile(target: User) -> dict:
    """What a follower is allowed to see about `target`, shaped by *their own*
    follower_visibility choice — a single setting that applies to everyone
    who's been accepted, not something negotiated per follower."""
    level = target.follower_visibility
    if level == User.VisibilityLevel.NONE:
        return {"visibility": level}

    records = (
        QazoRecord.objects.filter(user=target)
        .select_related("prayer_type")
        .order_by("prayer_type__order")
    )
    total_missed = sum(r.total_missed for r in records)
    total_completed = sum(min(r.total_completed, r.total_missed) for r in records)
    percent_complete = round(total_completed / total_missed * 100, 2) if total_missed else 100.0

    data = {
        "visibility": level,
        "percent_complete": percent_complete,
        "current_streak": current_streak(target),
    }
    if level == User.VisibilityLevel.FULL:
        data["records"] = QazoRecordSerializer(records, many=True).data
    return data

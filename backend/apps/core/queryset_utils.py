from datetime import timedelta

from django.db.models import Q, QuerySet
from django.utils import timezone


def excluding_stale_completions(queryset: QuerySet, days: int = 1) -> QuerySet:
    """Keep rows still in progress (completed_at is null) or completed
    within the last `days` days — drop anything that finished longer ago.
    Shared by apps.zikr and apps.habits' collective-counter list views, both
    of which show an admin-curated goal that should quietly disappear a
    while after it's done, not linger forever or vanish instantly.

    Computed fresh on every call (never store this cutoff on a class body —
    that only runs once, at import time, and freezes at whatever date the
    process happened to start on)."""
    cutoff = timezone.now().date() - timedelta(days=days)
    return queryset.filter(Q(completed_at__isnull=True) | Q(completed_at__date__gte=cutoff))

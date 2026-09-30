from rest_framework.throttling import UserRateThrottle


class CollectiveHabitSyncThrottle(UserRateThrottle):
    """Same reasoning as apps.zikr.throttles.ZikrSyncThrottle — this only
    ever bites a scripted/spammed client, not normal tapping."""

    scope = "collective-habit-sync"

from rest_framework.throttling import UserRateThrottle


class ZikrSyncThrottle(UserRateThrottle):
    """The client syncs on a fixed ~10s timer (~6/min), so this only ever
    bites a scripted/spammed client, not normal usage."""

    scope = "zikr-sync"

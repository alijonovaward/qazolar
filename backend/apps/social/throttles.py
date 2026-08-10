from rest_framework.throttling import UserRateThrottle


class FollowRequestThrottle(UserRateThrottle):
    """Keyed by the requesting user (not IP) — guards against someone
    scripting through sequential user IDs to spam follow requests."""

    scope = "follow-request"

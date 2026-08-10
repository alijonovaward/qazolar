from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, F, Q, UniqueConstraint

from apps.core.models import TimeStampedModel


class FollowRelation(TimeStampedModel):
    """One user watching another's qazo progress — always starts as a request
    the *followee* must accept before any data is visible (see
    apps.social.services.visible_profile). Declining or removing a relation
    just deletes the row (no separate "declined" state to persist) so a
    fresh request can always be sent again later without fighting the unique
    constraint below."""

    class Status(models.TextChoices):
        PENDING = "pending", "Kutilmoqda"
        ACCEPTED = "accepted", "Qabul qilingan"

    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following"
    )
    followee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followers"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        constraints = [
            UniqueConstraint(fields=["follower", "followee"], name="unique_follow_pair"),
            CheckConstraint(condition=~Q(follower=F("followee")), name="no_self_follow"),
        ]

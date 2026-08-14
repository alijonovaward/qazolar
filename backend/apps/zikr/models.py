from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Zikr(TimeStampedModel):
    """Admin-curated dhikr campaign — a collective goal all users chip away at
    together (see services.sync_zikr_count). current_count is the live
    running total across every user, never reset."""

    arabic_text = models.CharField(max_length=500)
    transliteration = models.CharField(max_length=255, help_text="Masalan: Laa ilaaha illalloh")
    translation = models.CharField(max_length=500, help_text="Masalan: Allohdan o'zga iloh yo'q")
    # BigInteger, not the usual PositiveIntegerField — a collective counter
    # like this can plausibly climb into the billions over time.
    target_count = models.PositiveBigIntegerField()
    current_count = models.PositiveBigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.transliteration

    @property
    def percent_complete(self) -> float:
        if self.target_count == 0:
            return 100.0
        return round(min(self.current_count / self.target_count, 1) * 100, 2)

    @property
    def remaining(self) -> int:
        return max(self.target_count - self.current_count, 0)


class UserZikrCount(TimeStampedModel):
    """One user's personal contribution to a Zikr — powers the participant
    count and (later, if wanted) a personal-total display."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="zikr_counts"
    )
    zikr = models.ForeignKey(Zikr, on_delete=models.CASCADE, related_name="user_counts")
    count = models.PositiveBigIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "zikr"], name="unique_user_zikr_count")
        ]

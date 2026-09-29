from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Habit(TimeStampedModel):
    """A user-defined personal daily task — 'Turnikka tortish', 'Kitob o'qish'
    va hokazo. Zikr'dan farqli, bu admin-curated emas: har bir foydalanuvchi
    o'zinikini yaratadi, va faqat o'ziga ko'rinadi."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits"
    )
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=30, help_text="Masalan: marta, daqiqa, bet, qadam")
    daily_target = models.PositiveIntegerField(
        null=True, blank=True, help_text="Ixtiyoriy kunlik maqsad — bo'sh qoldirilsa, shunchaki kuzatiladi"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class HabitLog(TimeStampedModel):
    """Bitta (habit, date) uchun kunlik jami — DailyLog'dagi kabi, bir necha
    marta +N qo'shib borilishi mumkin (see services.add_habit_progress), bir
    martalik "bugungi son" emas."""

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="logs")
    date = models.DateField()
    amount = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["habit", "date"], name="unique_habitlog_per_habit_date")
        ]
        indexes = [models.Index(fields=["habit", "date"])]
        ordering = ["-date"]

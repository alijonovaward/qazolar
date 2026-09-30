import secrets

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


def generate_invite_token() -> str:
    return secrets.token_urlsafe(12)


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


class CollectiveHabit(TimeStampedModel):
    """2-bosqich: admin-curated, hammaga ochiq jamoaviy vazifa — Zikr bilan
    bir xil jamoaviy-hisoblagich naqshi (see services.sync_collective_habit),
    faqat dhikr-ga xos bo'lmagan har qanday umumiy vazifa uchun (masalan
    'Jamoaviy: 50 000 qadam yurish'). Shaxsiy Habit'dan farqli, bu — bitta
    umumiy maqsad, hamma o'z hissasini qo'shadi."""

    name = models.CharField(max_length=200)
    unit = models.CharField(max_length=30, help_text="Masalan: qadam, bet, daqiqa")
    target_count = models.PositiveBigIntegerField()
    current_count = models.PositiveBigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name

    @property
    def percent_complete(self) -> float:
        if self.target_count == 0:
            return 100.0
        return round(min(self.current_count / self.target_count, 1) * 100, 2)

    @property
    def remaining(self) -> int:
        return max(self.target_count - self.current_count, 0)

    @property
    def duration_days(self) -> int | None:
        if self.completed_at is None:
            return None
        return (self.completed_at.date() - self.created_at.date()).days


class UserCollectiveHabitCount(TimeStampedModel):
    """One user's personal contribution to a CollectiveHabit — same role as
    apps.zikr.UserZikrCount."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="collective_habit_counts"
    )
    collective_habit = models.ForeignKey(
        CollectiveHabit, on_delete=models.CASCADE, related_name="user_counts"
    )
    count = models.PositiveBigIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "collective_habit"], name="unique_user_collective_habit_count"
            )
        ]


class SharedHabit(TimeStampedModel):
    """3-bosqich: foydalanuvchi o'zi yaratgan, faqat taklif qilingan yoki link
    orqali qo'shilganlar ko'radigan jamoaviy vazifa — CollectiveHabit'dan
    asosiy farqi shu: hech qachon umumiy ro'yxatda, hammaga ochiq bo'lmaydi.
    Yaratuvchi avtomatik birinchi a'zo bo'ladi (see services.create_shared_habit)."""

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_shared_habits"
    )
    name = models.CharField(max_length=200)
    unit = models.CharField(max_length=30, help_text="Masalan: qadam, bet, daqiqa")
    target_count = models.PositiveBigIntegerField()
    current_count = models.PositiveBigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    # Sirtqi (ilova tashqarisidagi) "qo'shilish" havolasi shunga asoslanadi —
    # taxmin qilib bo'lmaydigan tasodifiy qiymat, ketma-ket ID emas.
    invite_token = models.CharField(max_length=24, unique=True, default=generate_invite_token)

    def __str__(self):
        return self.name

    @property
    def percent_complete(self) -> float:
        if self.target_count == 0:
            return 100.0
        return round(min(self.current_count / self.target_count, 1) * 100, 2)

    @property
    def remaining(self) -> int:
        return max(self.target_count - self.current_count, 0)

    @property
    def duration_days(self) -> int | None:
        if self.completed_at is None:
            return None
        return (self.completed_at.date() - self.created_at.date()).days


class SharedHabitMember(TimeStampedModel):
    """A row here IS membership — created the moment someone joins (via link
    or an accepted invite), then incremented via sync. Same role as
    UserCollectiveHabitCount, but membership itself (not just contribution
    tracking) hinges on this row existing."""

    shared_habit = models.ForeignKey(SharedHabit, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shared_habit_memberships"
    )
    count = models.PositiveBigIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["shared_habit", "user"], name="unique_shared_habit_member")
        ]


class SharedHabitInvite(TimeStampedModel):
    """A pending in-app invite — same "the row's existence is the pending
    state" pattern as apps.social.FollowRelation, except there's no
    'accepted' state to keep afterward: accepting creates a
    SharedHabitMember and deletes this row, declining just deletes it."""

    shared_habit = models.ForeignKey(SharedHabit, on_delete=models.CASCADE, related_name="invites")
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_shared_habit_invites"
    )
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_shared_habit_invites"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["shared_habit", "invitee"], name="unique_shared_habit_invite"
            )
        ]

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class PrayerType(models.Model):
    class Code(models.TextChoices):
        BOMDOD = "bomdod", "Bomdod"
        PESHIN = "peshin", "Peshin"
        ASR = "asr", "Asr"
        SHOM = "shom", "Shom"
        XUFTON = "xufton", "Xufton"
        VITR = "vitr", "Vitr"

    code = models.CharField(max_length=20, choices=Code.choices, unique=True)
    name = models.CharField(max_length=50)
    order = models.PositiveSmallIntegerField(unique=True)
    rakat_count = models.PositiveSmallIntegerField(help_text="Hazar holatidagi farz rakat")
    qasr_rakat_count = models.PositiveSmallIntegerField(help_text="Safar (qasr) holatidagi farz rakat")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name

    def rakats_for(self, is_safar: bool) -> int:
        return self.qasr_rakat_count if is_safar else self.rakat_count


class InitialQazoSetup(TimeStampedModel):
    class Status(models.TextChoices):
        CONSISTENT = "consistent", "Muntazam o'qiyman"
        OWES_QAZO = "owes_qazo", "Qazosi bor"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="qazo_setups"
    )
    prayer_type = models.ForeignKey(PrayerType, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices)
    hazar_manual_override_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="owes_qazo holatida taxminiy oddiy (hazar) qazo soni. Berilmasa 0 dan boshlanadi.",
    )
    qasr_manual_override_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="owes_qazo holatida taxminiy safar (qasr) qazo soni. Berilmasa 0 dan boshlanadi.",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "prayer_type"], name="unique_setup_per_user_prayer")
        ]


class QazoRecord(TimeStampedModel):
    """Hazar (normal) and qasr (safar) debt are tracked as separate buckets —
    a prayer missed while travelling still owes a *qasr* qada even once the
    trip is over, so it can't be merged into the hazar bucket."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="qazo_records"
    )
    prayer_type = models.ForeignKey(PrayerType, on_delete=models.CASCADE)
    hazar_missed = models.PositiveIntegerField(default=0)
    hazar_completed = models.PositiveIntegerField(default=0)
    qasr_missed = models.PositiveIntegerField(default=0)
    qasr_completed = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "prayer_type"], name="unique_record_per_user_prayer")
        ]

    @property
    def total_missed(self) -> int:
        return self.hazar_missed + self.qasr_missed

    @property
    def total_completed(self) -> int:
        return self.hazar_completed + self.qasr_completed

    @property
    def remaining_hazar(self) -> int:
        return max(self.hazar_missed - self.hazar_completed, 0)

    @property
    def remaining_qasr(self) -> int:
        return max(self.qasr_missed - self.qasr_completed, 0)

    @property
    def remaining_count(self) -> int:
        return self.remaining_hazar + self.remaining_qasr

    @property
    def percent_complete(self) -> float:
        total_missed = self.total_missed
        if total_missed == 0:
            return 100.0
        return round(min(self.total_completed, total_missed) / total_missed * 100, 2)


class DailyLog(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="daily_logs"
    )
    prayer_type = models.ForeignKey(PrayerType, on_delete=models.CASCADE)
    date = models.DateField()
    hazar_missed_count = models.PositiveIntegerField(default=0, help_text="Shu kun oddiy holatda qoldirilgan")
    hazar_completed_count = models.PositiveIntegerField(default=0, help_text="Shu kun oddiy holatda o'qilgan qazo")
    qasr_missed_count = models.PositiveIntegerField(default=0, help_text="Shu kun safarda qoldirilgan")
    qasr_completed_count = models.PositiveIntegerField(default=0, help_text="Shu kun safarda o'qilgan qazo")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "prayer_type", "date"], name="unique_log_per_user_prayer_date")
        ]
        indexes = [models.Index(fields=["user", "date"])]
        ordering = ["-date"]


class TapLog(TimeStampedModel):
    """One row per actual +/- tap on the dashboard — DailyLog only keeps a
    running daily total per (user, prayer_type, date), not who tapped what
    when. This is what powers the dashboard's 'So'nggi amallar' list, so
    someone unsure whether a tap registered can scroll down and see it.
    A no-op tap (e.g. *_completed when nothing is owed) is never logged
    here, since nothing actually changed."""

    class Field(models.TextChoices):
        HAZAR_MISSED = "hazar_missed", "Oddiy qoldirildi"
        HAZAR_COMPLETED = "hazar_completed", "Oddiy o'qildi"
        QASR_MISSED = "qasr_missed", "Safar qoldirildi"
        QASR_COMPLETED = "qasr_completed", "Safar qazosi o'qildi"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tap_logs"
    )
    prayer_type = models.ForeignKey(PrayerType, on_delete=models.CASCADE)
    field = models.CharField(max_length=20, choices=Field.choices)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]


class DailyGoal(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="daily_goals"
    )
    date = models.DateField()
    target_count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="unique_goal_per_user_date")
        ]

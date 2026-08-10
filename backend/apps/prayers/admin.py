from django.contrib import admin

from .models import DailyGoal, DailyLog, InitialQazoSetup, PrayerType, QazoRecord


@admin.register(PrayerType)
class PrayerTypeAdmin(admin.ModelAdmin):
    list_display = ["order", "code", "name", "rakat_count", "qasr_rakat_count"]


@admin.register(InitialQazoSetup)
class InitialQazoSetupAdmin(admin.ModelAdmin):
    list_display = ["user", "prayer_type", "status", "hazar_manual_override_count", "qasr_manual_override_count"]
    list_filter = ["status", "prayer_type"]


@admin.register(QazoRecord)
class QazoRecordAdmin(admin.ModelAdmin):
    list_display = [
        "user", "prayer_type", "hazar_missed", "hazar_completed", "qasr_missed", "qasr_completed",
    ]
    list_filter = ["prayer_type"]


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = [
        "user", "prayer_type", "date",
        "hazar_missed_count", "hazar_completed_count", "qasr_missed_count", "qasr_completed_count",
    ]
    list_filter = ["prayer_type"]
    date_hierarchy = "date"


@admin.register(DailyGoal)
class DailyGoalAdmin(admin.ModelAdmin):
    list_display = ["user", "date", "target_count"]
    date_hierarchy = "date"

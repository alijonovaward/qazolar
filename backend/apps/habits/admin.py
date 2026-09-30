from django.contrib import admin

from .models import CollectiveHabit, Habit, HabitLog, UserCollectiveHabitCount


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ["user", "name", "unit", "daily_target", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "user__email", "user__username"]


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ["habit", "date", "amount"]
    list_filter = ["date"]
    date_hierarchy = "date"


@admin.register(CollectiveHabit)
class CollectiveHabitAdmin(admin.ModelAdmin):
    list_display = [
        "order",
        "name",
        "unit",
        "target_count",
        "current_count",
        "is_active",
        "created_at",
        "completed_at",
    ]
    list_display_links = ["name"]
    list_editable = ["is_active", "order"]
    ordering = ["order", "id"]


@admin.register(UserCollectiveHabitCount)
class UserCollectiveHabitCountAdmin(admin.ModelAdmin):
    list_display = ["user", "collective_habit", "count"]
    list_filter = ["collective_habit"]

from django.contrib import admin

from .models import Habit, HabitLog


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

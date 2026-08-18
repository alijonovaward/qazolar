from django.contrib import admin

from .models import UserZikrCount, Zikr


@admin.register(Zikr)
class ZikrAdmin(admin.ModelAdmin):
    list_display = [
        "order",
        "transliteration",
        "target_count",
        "current_count",
        "is_active",
        "created_at",
        "completed_at",
    ]
    list_display_links = ["transliteration"]
    list_editable = ["is_active", "order"]
    ordering = ["order", "id"]


@admin.register(UserZikrCount)
class UserZikrCountAdmin(admin.ModelAdmin):
    list_display = ["user", "zikr", "count"]
    list_filter = ["zikr"]

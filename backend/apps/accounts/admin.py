from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import MenstruationPeriod, OTPCode, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["email"]
    list_display = ["email", "gender", "is_staff", "is_active", "created_at"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("phone", "gender", "birth_date")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )
    search_fields = ["email"]


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ["email", "expires_at", "is_used", "attempt_count", "created_at"]
    search_fields = ["email"]


@admin.register(MenstruationPeriod)
class MenstruationPeriodAdmin(admin.ModelAdmin):
    list_display = ["user", "start_date", "end_date"]

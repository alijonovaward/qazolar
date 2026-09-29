from django.utils import timezone
from rest_framework import serializers

from .models import Habit, HabitLog
from .services import habit_streak


class HabitSerializer(serializers.ModelSerializer):
    today_amount = serializers.SerializerMethodField()
    percent_complete = serializers.SerializerMethodField()
    current_streak = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            "id",
            "name",
            "unit",
            "daily_target",
            "is_active",
            "today_amount",
            "percent_complete",
            "current_streak",
            "created_at",
        ]

    def get_today_amount(self, obj: Habit) -> int:
        today = timezone.localdate()
        log = obj.logs.filter(date=today).first()
        return log.amount if log else 0

    def get_percent_complete(self, obj: Habit) -> float | None:
        # No target set — "percent of what?" doesn't apply, so this stays
        # null rather than a made-up 0/100.
        if not obj.daily_target:
            return None
        today_amount = self.get_today_amount(obj)
        return round(min(today_amount / obj.daily_target, 1) * 100, 2)

    def get_current_streak(self, obj: Habit) -> int:
        return habit_streak(obj)


class HabitWriteSerializer(serializers.ModelSerializer):
    """Create and partial-update (e.g. is_active=False to archive) both go
    through this — the read shape (with today_amount/streak) is always
    HabitSerializer, returned separately after save."""

    class Meta:
        model = Habit
        fields = ["name", "unit", "daily_target", "is_active"]


class HabitAddProgressSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=1)


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ["date", "amount"]

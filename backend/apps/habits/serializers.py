from django.utils import timezone
from rest_framework import serializers

from apps.social.serializers import MiniUserSerializer

from .models import CollectiveHabit, Habit, SharedHabit, SharedHabitInvite
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


class TopContributorSerializer(serializers.Serializer):
    """Shaped straight off a UserCollectiveHabitCount instance (it already
    has exactly .user and .count) — same as apps.zikr's version."""

    user = MiniUserSerializer()
    count = serializers.IntegerField()


class CollectiveHabitSerializer(serializers.ModelSerializer):
    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    top_contributors = serializers.SerializerMethodField()

    class Meta:
        model = CollectiveHabit
        fields = [
            "id",
            "name",
            "unit",
            "target_count",
            "current_count",
            "percent_complete",
            "remaining",
            "participant_count",
            "my_count",
            "top_contributors",
            "created_at",
            "completed_at",
            "duration_days",
        ]

    def get_participant_count(self, obj: CollectiveHabit) -> int:
        return obj.user_counts.filter(count__gt=0).count()

    def get_my_count(self, obj: CollectiveHabit) -> int:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return 0
        user_count = obj.user_counts.filter(user=request.user).first()
        return user_count.count if user_count else 0

    def get_top_contributors(self, obj: CollectiveHabit) -> list[dict]:
        top = obj.user_counts.filter(count__gt=0).select_related("user").order_by("-count")[:3]
        return TopContributorSerializer(top, many=True).data


class CollectiveHabitSyncSerializer(serializers.Serializer):
    delta = serializers.IntegerField(min_value=1)


class SharedHabitSerializer(serializers.ModelSerializer):
    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    top_contributors = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()

    class Meta:
        model = SharedHabit
        fields = [
            "id",
            "name",
            "unit",
            "target_count",
            "current_count",
            "percent_complete",
            "remaining",
            "participant_count",
            "my_count",
            "top_contributors",
            "is_creator",
            "invite_token",
            "created_at",
            "completed_at",
            "duration_days",
        ]

    def get_participant_count(self, obj: SharedHabit) -> int:
        return obj.members.count()

    def get_my_count(self, obj: SharedHabit) -> int:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return 0
        member = obj.members.filter(user=request.user).first()
        return member.count if member else 0

    def get_top_contributors(self, obj: SharedHabit) -> list[dict]:
        top = obj.members.filter(count__gt=0).select_related("user").order_by("-count")[:3]
        return TopContributorSerializer(top, many=True).data

    def get_is_creator(self, obj: SharedHabit) -> bool:
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.creator_id == request.user.id)


class SharedHabitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SharedHabit
        fields = ["name", "unit", "target_count"]


class SharedHabitSyncSerializer(serializers.Serializer):
    delta = serializers.IntegerField(min_value=1)


class SharedHabitInviteCreateSerializer(serializers.Serializer):
    username = serializers.CharField()


class SharedHabitInviteSerializer(serializers.ModelSerializer):
    shared_habit = serializers.SerializerMethodField()
    invited_by = MiniUserSerializer(read_only=True)
    invitee = MiniUserSerializer(read_only=True)

    class Meta:
        model = SharedHabitInvite
        fields = ["id", "shared_habit", "invited_by", "invitee", "created_at"]

    def get_shared_habit(self, obj: SharedHabitInvite) -> dict:
        return {"id": obj.shared_habit_id, "name": obj.shared_habit.name}

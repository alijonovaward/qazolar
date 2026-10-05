from django.utils import timezone
from rest_framework import serializers

from apps.core.serializers import LeaderboardMixin
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


class CollectiveHabitSerializer(LeaderboardMixin, serializers.ModelSerializer):
    member_related_name = "user_counts"

    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    my_rank = serializers.SerializerMethodField()
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
            "my_rank",
            "top_contributors",
            "created_at",
            "completed_at",
            "duration_days",
        ]


class CollectiveHabitSyncSerializer(serializers.Serializer):
    delta = serializers.IntegerField(min_value=1)


class SharedHabitSerializer(LeaderboardMixin, serializers.ModelSerializer):
    member_related_name = "members"

    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    my_rank = serializers.SerializerMethodField()
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
            "my_rank",
            "top_contributors",
            "is_creator",
            "invite_token",
            "created_at",
            "completed_at",
            "duration_days",
        ]

    def get_participant_count(self, obj: SharedHabit) -> int:
        # Overrides LeaderboardMixin's "active contributors only" version on
        # purpose — membership here is an explicit join/accept step (see
        # SharedHabitMember), so someone who joined but hasn't logged
        # anything yet is still a real participant, unlike Zikr/
        # CollectiveHabit where a contribution row only exists once you've
        # actually tapped. Reads from the same prefetched/cached dataset as
        # the rest of the mixin instead of issuing its own obj.members.count().
        return len(self._all_members(obj))

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

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import FollowRelation
from .services import visible_profile

User = get_user_model()


class MiniUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "nickname", "email"]


class TopContributorSerializer(serializers.Serializer):
    """One row of a collective-counter leaderboard — shaped straight off a
    per-user contribution instance (it already has exactly .user and
    .count). Shared by apps.zikr.Zikr, apps.habits.CollectiveHabit, and
    apps.habits.SharedHabit (see apps.core.serializers.LeaderboardMixin)."""

    user = MiniUserSerializer()
    count = serializers.IntegerField()


class FollowRequestCreateSerializer(serializers.Serializer):
    username = serializers.CharField()


class FollowRelationSerializer(serializers.ModelSerializer):
    follower = MiniUserSerializer(read_only=True)
    followee = MiniUserSerializer(read_only=True)

    class Meta:
        model = FollowRelation
        fields = ["id", "follower", "followee", "status", "created_at"]


class FollowingRelationSerializer(FollowRelationSerializer):
    """Same as FollowRelationSerializer, plus the followee's data — shaped by
    *their* visibility choice (see services.visible_profile)."""

    followee_profile = serializers.SerializerMethodField()

    class Meta(FollowRelationSerializer.Meta):
        fields = FollowRelationSerializer.Meta.fields + ["followee_profile"]

    def get_followee_profile(self, obj):
        return visible_profile(obj.followee)

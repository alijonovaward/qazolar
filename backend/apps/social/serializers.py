from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import FollowRelation
from .services import visible_profile

User = get_user_model()


class MiniUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


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

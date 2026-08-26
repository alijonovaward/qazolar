from rest_framework import serializers

from apps.social.serializers import MiniUserSerializer

from .models import Zikr


class TopContributorSerializer(serializers.Serializer):
    """Shaped straight off a UserZikrCount instance (it already has exactly
    .user and .count) — no need to build an intermediate dict."""

    user = MiniUserSerializer()
    count = serializers.IntegerField()


class ZikrSerializer(serializers.ModelSerializer):
    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    top_contributors = serializers.SerializerMethodField()

    class Meta:
        model = Zikr
        fields = [
            "id",
            "arabic_text",
            "transliteration",
            "translation",
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

    def get_participant_count(self, obj: Zikr) -> int:
        return obj.user_counts.filter(count__gt=0).count()

    def get_my_count(self, obj: Zikr) -> int:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return 0
        user_count = obj.user_counts.filter(user=request.user).first()
        return user_count.count if user_count else 0

    def get_top_contributors(self, obj: Zikr) -> list[dict]:
        top = obj.user_counts.filter(count__gt=0).select_related("user").order_by("-count")[:3]
        return TopContributorSerializer(top, many=True).data


class ZikrSyncSerializer(serializers.Serializer):
    delta = serializers.IntegerField(min_value=1)

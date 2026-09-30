from rest_framework import serializers

from apps.core.serializers import LeaderboardMixin

from .models import Zikr


class ZikrSerializer(LeaderboardMixin, serializers.ModelSerializer):
    member_related_name = "user_counts"

    percent_complete = serializers.FloatField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    participant_count = serializers.SerializerMethodField()
    my_count = serializers.SerializerMethodField()
    my_rank = serializers.SerializerMethodField()
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
            "my_rank",
            "top_contributors",
            "created_at",
            "completed_at",
            "duration_days",
        ]


class ZikrSyncSerializer(serializers.Serializer):
    delta = serializers.IntegerField(min_value=1)

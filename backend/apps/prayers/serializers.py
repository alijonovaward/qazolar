from rest_framework import serializers

from .models import DailyGoal, DailyLog, InitialQazoSetup, PrayerType, QazoRecord


class PrayerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerType
        fields = ["code", "name", "order", "rakat_count", "qasr_rakat_count"]


class InitialQazoSetupWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InitialQazoSetup
        fields = ["status", "hazar_manual_override_count", "qasr_manual_override_count"]


class InitialQazoSetupReadSerializer(serializers.ModelSerializer):
    prayer_type = PrayerTypeSerializer(read_only=True)

    class Meta:
        model = InitialQazoSetup
        fields = [
            "prayer_type",
            "status",
            "hazar_manual_override_count",
            "qasr_manual_override_count",
            "updated_at",
        ]


class QazoRecordSerializer(serializers.ModelSerializer):
    prayer_type = PrayerTypeSerializer(read_only=True)
    total_missed = serializers.IntegerField(read_only=True)
    total_completed = serializers.IntegerField(read_only=True)
    remaining_count = serializers.IntegerField(read_only=True)
    remaining_hazar = serializers.IntegerField(read_only=True)
    remaining_qasr = serializers.IntegerField(read_only=True)
    percent_complete = serializers.FloatField(read_only=True)

    class Meta:
        model = QazoRecord
        fields = [
            "prayer_type",
            "hazar_missed",
            "hazar_completed",
            "qasr_missed",
            "qasr_completed",
            "total_missed",
            "total_completed",
            "remaining_count",
            "remaining_hazar",
            "remaining_qasr",
            "percent_complete",
            "updated_at",
        ]


class DailyLogIncrementSerializer(serializers.Serializer):
    prayer_type = serializers.SlugRelatedField(
        slug_field="code", queryset=PrayerType.objects.all()
    )
    date = serializers.DateField()
    field = serializers.ChoiceField(
        choices=["hazar_missed", "hazar_completed", "qasr_missed", "qasr_completed"]
    )


class DailyLogSerializer(serializers.ModelSerializer):
    prayer_type = PrayerTypeSerializer(read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "prayer_type",
            "date",
            "hazar_missed_count",
            "hazar_completed_count",
            "qasr_missed_count",
            "qasr_completed_count",
            "updated_at",
        ]


class DailyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyGoal
        fields = ["date", "target_count"]

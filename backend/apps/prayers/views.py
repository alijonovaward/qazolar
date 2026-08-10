from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DailyGoal, DailyLog, InitialQazoSetup, PrayerType, QazoRecord
from .serializers import (
    DailyGoalSerializer,
    DailyLogIncrementSerializer,
    DailyLogSerializer,
    InitialQazoSetupReadSerializer,
    InitialQazoSetupWriteSerializer,
    PrayerTypeSerializer,
    QazoRecordSerializer,
)
from .services.daily_log import increment_daily_log
from .services.forecast import current_streak, daily_rakat_rate, forecast_days_remaining, remaining_rakats
from .services.setup import apply_setup
from .services.stats import TREND_WINDOWS, TRUNC_FUNCS, remaining_trend


class PrayerTypeListView(generics.ListAPIView):
    serializer_class = PrayerTypeSerializer
    queryset = PrayerType.objects.all()


class QazoSetupListView(generics.ListAPIView):
    serializer_class = InitialQazoSetupReadSerializer

    def get_queryset(self):
        return (
            InitialQazoSetup.objects.filter(user=self.request.user)
            .select_related("prayer_type")
            .order_by("prayer_type__order")
        )


class QazoSetupUpsertView(APIView):
    def put(self, request, code):
        prayer_type = get_object_or_404(PrayerType, code=code)
        instance = InitialQazoSetup.objects.filter(
            user=request.user, prayer_type=prayer_type
        ).first()
        serializer = InitialQazoSetupWriteSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        setup = serializer.save(user=request.user, prayer_type=prayer_type)
        apply_setup(setup)
        return Response(
            InitialQazoSetupReadSerializer(setup).data, status=status.HTTP_200_OK
        )


class QazoRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QazoRecordSerializer

    def get_queryset(self):
        return (
            QazoRecord.objects.filter(user=self.request.user)
            .select_related("prayer_type")
            .order_by("prayer_type__order")
        )

    @action(detail=False, methods=["get"])
    def summary(self, request):
        records = list(self.get_queryset())
        total_missed = sum(r.total_missed for r in records)
        total_completed = sum(min(r.total_completed, r.total_missed) for r in records)
        percent_complete = (
            round(total_completed / total_missed * 100, 2) if total_missed else 100.0
        )
        remaining_rakats = sum(
            r.remaining_hazar * r.prayer_type.rakat_count
            + r.remaining_qasr * r.prayer_type.qasr_rakat_count
            for r in records
        )
        return Response(
            {
                "total_missed": total_missed,
                "total_completed": total_completed,
                "percent_complete": percent_complete,
                "remaining_rakats": remaining_rakats,
            }
        )


class DailyLogListView(generics.ListAPIView):
    serializer_class = DailyLogSerializer

    def get_queryset(self):
        qs = DailyLog.objects.filter(user=self.request.user).select_related("prayer_type")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs


class DailyLogIncrementView(APIView):
    """+1 to today's tally for one hazar/qasr bucket — the dashboard's
    tap-to-record +/- buttons call this directly, no batching."""

    def post(self, request):
        serializer = DailyLogIncrementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        log = increment_daily_log(user=request.user, **serializer.validated_data)
        return Response(DailyLogSerializer(log).data, status=status.HTTP_200_OK)


class DailyGoalTodayView(APIView):
    def get(self, request):
        today = timezone.localdate()
        goal = DailyGoal.objects.filter(user=request.user, date=today).first()
        if goal is None:
            return Response({"date": today, "target_count": 0})
        return Response(DailyGoalSerializer(goal).data)

    def put(self, request):
        today = timezone.localdate()
        target_count = request.data.get("target_count", 0)
        goal, _ = DailyGoal.objects.update_or_create(
            user=request.user, date=today, defaults={"target_count": target_count}
        )
        return Response(DailyGoalSerializer(goal).data)


class StatsView(APIView):
    def get(self, request):
        period = request.query_params.get("period", "week")
        trunc_fn = TRUNC_FUNCS.get(period)
        if trunc_fn is None:
            return Response(
                {"detail": "period 'day', 'week', 'month' yoki 'year' bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = DailyLog.objects.filter(user=request.user)
        prayer_type_code = request.query_params.get("prayer_type", "all")
        if prayer_type_code != "all":
            qs = qs.filter(prayer_type__code=prayer_type_code)

        buckets = (
            qs.annotate(bucket=trunc_fn("date"))
            .values("bucket")
            .annotate(
                total_completed=Sum(F("hazar_completed_count") + F("qasr_completed_count"))
            )
            .order_by("bucket")
        )
        return Response(list(buckets))


class RemainingTrendView(APIView):
    """Total remaining qazo count as of the end of every bucket in a fixed
    trailing window per tab (day=last 14 days, week=last 7, month=last 30,
    year=last 52 weeks) — a continuous series (gaps carried forward flat) so
    the chart always shows the real shape of the *recent* debt instead of
    being flattened by unrelated history outside the window."""

    def get(self, request):
        period = request.query_params.get("period", "week")
        if period not in TREND_WINDOWS:
            return Response(
                {"detail": "period 'day', 'week', 'month' yoki 'year' bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prayer_type_code = request.query_params.get("prayer_type", "all")
        return Response(remaining_trend(request.user, period, prayer_type_code))


class ForecastView(APIView):
    def get(self, request):
        rate = daily_rakat_rate(request.user)
        remaining = remaining_rakats(request.user)
        days = forecast_days_remaining(request.user)
        return Response(
            {
                "daily_rakat_rate": round(rate, 3),
                "remaining_rakats": remaining,
                "forecast_days_remaining": round(days, 1) if days is not None else None,
                "forecast_years_remaining": round(days / 365, 2) if days is not None else None,
            }
        )


class StreakView(APIView):
    def get(self, request):
        return Response({"current_streak": current_streak(request.user)})

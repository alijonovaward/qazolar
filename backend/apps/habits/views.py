from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.queryset_utils import excluding_stale_completions

from .models import CollectiveHabit, Habit
from .serializers import (
    CollectiveHabitSerializer,
    CollectiveHabitSyncSerializer,
    HabitAddProgressSerializer,
    HabitSerializer,
    HabitWriteSerializer,
)
from .services import add_habit_progress, habit_trend, sync_collective_habit
from .throttles import CollectiveHabitSyncThrottle


class HabitListCreateView(generics.ListCreateAPIView):
    """Personal, never admin-curated — every habit is scoped to its own
    creator, both for listing and for creation."""

    pagination_class = None

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        return HabitWriteSerializer if self.request.method == "POST" else HabitSerializer

    def create(self, request, *args, **kwargs):
        serializer = HabitWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        habit = serializer.save(user=request.user)
        return Response(HabitSerializer(habit).data, status=status.HTTP_201_CREATED)


class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH to edit or archive (is_active=False), DELETE to remove
    outright — either way, scoped to the owner only."""

    serializer_class = HabitWriteSerializer

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        habit = self.get_object()
        serializer = HabitWriteSerializer(habit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return Response(HabitSerializer(habit).data)


class HabitAddProgressView(APIView):
    """+amount to today's tally — the dashboard-style quick-add, not a
    'set today's total' overwrite (see services.add_habit_progress)."""

    def post(self, request, pk):
        habit = get_object_or_404(Habit, pk=pk, user=request.user, is_active=True)
        serializer = HabitAddProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        add_habit_progress(habit, timezone.localdate(), serializer.validated_data["amount"])
        return Response(HabitSerializer(habit).data)


class HabitTrendView(APIView):
    """Last 14 days for one habit's chart, zero-filled (see
    services.habit_trend) — a continuous window, not just the days that
    happen to have a log row."""

    def get(self, request, pk):
        habit = get_object_or_404(Habit, pk=pk, user=request.user)
        return Response(habit_trend(habit))


class CollectiveHabitListView(generics.ListAPIView):
    """2-bosqich: admin-curated, hammaga ochiq — apps.zikr.ZikrListView bilan
    bir xil naqsh (never paginated, stale-completion hiding)."""

    serializer_class = CollectiveHabitSerializer
    pagination_class = None

    def get_queryset(self):
        return excluding_stale_completions(CollectiveHabit.objects.filter(is_active=True))


class CollectiveHabitSyncView(APIView):
    throttle_classes = [CollectiveHabitSyncThrottle]

    def post(self, request, pk):
        collective_habit = get_object_or_404(CollectiveHabit, pk=pk, is_active=True)
        serializer = CollectiveHabitSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        collective_habit = sync_collective_habit(
            request.user, collective_habit, serializer.validated_data["delta"]
        )
        return Response(CollectiveHabitSerializer(collective_habit, context={"request": request}).data)

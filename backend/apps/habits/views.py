from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Habit, HabitLog
from .serializers import (
    HabitAddProgressSerializer,
    HabitLogSerializer,
    HabitSerializer,
    HabitWriteSerializer,
)
from .services import add_habit_progress


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


class HabitLogListView(generics.ListAPIView):
    """Recent daily history for one habit — capped, not paginated, same
    reasoning as apps.zikr's TapLog list: a short recent slice, not a
    browsable full archive."""

    serializer_class = HabitLogSerializer
    pagination_class = None

    def get_queryset(self):
        habit = get_object_or_404(Habit, pk=self.kwargs["pk"], user=self.request.user)
        return habit.logs.order_by("-date")[:30]

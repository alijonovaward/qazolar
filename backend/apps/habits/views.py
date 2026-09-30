from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.queryset_utils import excluding_stale_completions

from .models import CollectiveHabit, Habit, SharedHabit, SharedHabitInvite, SharedHabitMember
from .serializers import (
    CollectiveHabitSerializer,
    CollectiveHabitSyncSerializer,
    HabitAddProgressSerializer,
    HabitSerializer,
    HabitWriteSerializer,
    SharedHabitCreateSerializer,
    SharedHabitInviteCreateSerializer,
    SharedHabitInviteSerializer,
    SharedHabitSerializer,
    SharedHabitSyncSerializer,
)
from .services import (
    add_habit_progress,
    create_shared_habit,
    habit_trend,
    join_shared_habit,
    sync_collective_habit,
    sync_shared_habit,
)
from .throttles import CollectiveHabitSyncThrottle, SharedHabitInviteThrottle

User = get_user_model()


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


class SharedHabitListCreateView(generics.ListCreateAPIView):
    """3-bosqich: hech qachon umumiy ro'yxat emas — faqat men yaratgan yoki
    a'zo bo'lgan sherikli vazifalar (yaratuvchi ham a'zo, see
    services.create_shared_habit), CollectiveHabit'dan asosiy farq shu."""

    pagination_class = None

    def get_queryset(self):
        return (
            SharedHabit.objects.filter(members__user=self.request.user, is_active=True)
            .distinct()
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        return SharedHabitCreateSerializer if self.request.method == "POST" else SharedHabitSerializer

    def get_serializer_context(self):
        return {"request": self.request}

    def create(self, request, *args, **kwargs):
        serializer = SharedHabitCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shared_habit = create_shared_habit(request.user, **serializer.validated_data)
        return Response(
            SharedHabitSerializer(shared_habit, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SharedHabitSyncView(APIView):
    throttle_classes = [CollectiveHabitSyncThrottle]

    def post(self, request, pk):
        # membership required — this is the whole point of "shared, not
        # open": only someone who joined (link or accepted invite) can
        # contribute, unlike CollectiveHabit which anyone can sync.
        shared_habit = get_object_or_404(
            SharedHabit, pk=pk, is_active=True, members__user=request.user
        )
        serializer = SharedHabitSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shared_habit = sync_shared_habit(request.user, shared_habit, serializer.validated_data["delta"])
        return Response(SharedHabitSerializer(shared_habit, context={"request": request}).data)


class SharedHabitJoinView(APIView):
    """The link-based join — anyone with the token (and an account) is
    added directly, no accept step, since opening the link and being logged
    in already *is* the accept."""

    def post(self, request, token):
        shared_habit = get_object_or_404(SharedHabit, invite_token=token, is_active=True)
        join_shared_habit(request.user, shared_habit)
        return Response(SharedHabitSerializer(shared_habit, context={"request": request}).data)


class SharedHabitInviteCreateView(APIView):
    """The in-app invite — creator only, by username, same lookup pattern as
    apps.social.FollowRequestCreateView."""

    throttle_classes = [SharedHabitInviteThrottle]

    def post(self, request, pk):
        shared_habit = get_object_or_404(SharedHabit, pk=pk, creator=request.user, is_active=True)
        serializer = SharedHabitInviteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"].lstrip("@").lower()

        invitee = User.objects.filter(username=username).first()
        if invitee is None:
            raise NotFound({"detail": "Bunday username topilmadi"})
        if invitee.id == request.user.id:
            return Response(
                {"detail": "O'zingizni taklif qila olmaysiz"}, status=status.HTTP_400_BAD_REQUEST
            )
        if SharedHabitMember.objects.filter(shared_habit=shared_habit, user=invitee).exists():
            return Response(
                {"detail": "Bu foydalanuvchi allaqachon a'zo"}, status=status.HTTP_400_BAD_REQUEST
            )
        if SharedHabitInvite.objects.filter(shared_habit=shared_habit, invitee=invitee).exists():
            return Response(
                {"detail": "Bu foydalanuvchiga allaqachon taklif yuborilgan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invite = SharedHabitInvite.objects.create(
            shared_habit=shared_habit, invited_by=request.user, invitee=invitee
        )
        return Response(SharedHabitInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class SharedHabitIncomingInvitesView(generics.ListAPIView):
    """Pending invites addressed to me — same role as
    apps.social.IncomingFollowRequestsView."""

    serializer_class = SharedHabitInviteSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            SharedHabitInvite.objects.filter(invitee=self.request.user)
            .select_related("shared_habit", "invited_by", "invitee")
            .order_by("-created_at")
        )


class SharedHabitInviteAcceptView(APIView):
    def post(self, request, pk):
        invite = get_object_or_404(SharedHabitInvite, pk=pk, invitee=request.user)
        join_shared_habit(request.user, invite.shared_habit)
        invite.delete()
        return Response(
            SharedHabitSerializer(invite.shared_habit, context={"request": request}).data
        )


class SharedHabitInviteRemoveView(APIView):
    """Covers both declining (invitee) and cancelling (the one who sent it)
    — either side of the pending invite can delete it, same pattern as
    apps.social.FollowRelationRemoveView."""

    def delete(self, request, pk):
        invite = get_object_or_404(
            SharedHabitInvite.objects.filter(Q(invitee=request.user) | Q(invited_by=request.user)),
            pk=pk,
        )
        invite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

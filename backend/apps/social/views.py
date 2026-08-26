from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.prayers.services.stats import TREND_WINDOWS, remaining_trend

from .models import FollowRelation
from .serializers import (
    FollowingRelationSerializer,
    FollowRelationSerializer,
    FollowRequestCreateSerializer,
)
from .throttles import FollowRequestThrottle

User = get_user_model()


class FollowRequestCreateView(APIView):
    throttle_classes = [FollowRequestThrottle]

    def post(self, request):
        serializer = FollowRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"].lstrip("@").lower()

        followee = User.objects.filter(username=username).first()
        if followee is None:
            raise NotFound({"detail": "Bunday username topilmadi"})
        if followee.id == request.user.id:
            return Response(
                {"detail": "O'zingizni kuzata olmaysiz"}, status=status.HTTP_400_BAD_REQUEST
            )
        if FollowRelation.objects.filter(follower=request.user, followee=followee).exists():
            return Response(
                {"detail": "Allaqachon so'rov yuborilgan yoki kuzatyapsiz"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        relation = FollowRelation.objects.create(
            follower=request.user, followee=followee, status=FollowRelation.Status.PENDING
        )
        return Response(FollowRelationSerializer(relation).data, status=status.HTTP_201_CREATED)


class IncomingFollowRequestsView(generics.ListAPIView):
    serializer_class = FollowRelationSerializer

    def get_queryset(self):
        return (
            FollowRelation.objects.filter(
                followee=self.request.user, status=FollowRelation.Status.PENDING
            )
            .select_related("follower", "followee")
            .order_by("-created_at")
        )


class AcceptFollowRequestView(APIView):
    def post(self, request, pk):
        relation = get_object_or_404(
            FollowRelation,
            pk=pk,
            followee=request.user,
            status=FollowRelation.Status.PENDING,
        )
        relation.status = FollowRelation.Status.ACCEPTED
        relation.save(update_fields=["status", "updated_at"])
        return Response(FollowRelationSerializer(relation).data)


class FollowRelationRemoveView(APIView):
    """Covers declining a pending request, unfollowing, and removing a
    follower — one relation, either side of it can delete it."""

    def delete(self, request, pk):
        relation = get_object_or_404(
            FollowRelation.objects.filter(Q(follower=request.user) | Q(followee=request.user)),
            pk=pk,
        )
        relation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowingListView(generics.ListAPIView):
    serializer_class = FollowingRelationSerializer

    def get_queryset(self):
        return (
            FollowRelation.objects.filter(
                follower=self.request.user, status=FollowRelation.Status.ACCEPTED
            )
            .select_related("follower", "followee")
            .order_by("followee__email")
        )


class FolloweeRemainingTrendView(APIView):
    """The same 'qolgan qazo' trend the followee sees on their own /stats,
    for the compact sparkline on their FolloweeProfileView card — always the
    combined total (no per-prayer filter, no period tabs), gated by the same
    visibility tier as percent_complete/current_streak (PERCENT_ONLY or FULL,
    never NONE), since it's an aggregate, not a per-prayer breakdown."""

    def get(self, request, pk):
        relation = get_object_or_404(
            FollowRelation,
            pk=pk,
            follower=request.user,
            status=FollowRelation.Status.ACCEPTED,
        )
        followee = relation.followee
        if followee.follower_visibility == User.VisibilityLevel.NONE:
            return Response(
                {"detail": "Bu foydalanuvchi ma'lumotlarini ko'rsatishni yoqmagan"},
                status=status.HTTP_403_FORBIDDEN,
            )

        period = request.query_params.get("period", "week")
        if period not in TREND_WINDOWS:
            return Response(
                {"detail": "period 'day', 'week', 'month' yoki 'year' bo'lishi kerak"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(remaining_trend(followee, period, "all"))


class FollowersListView(generics.ListAPIView):
    serializer_class = FollowRelationSerializer

    def get_queryset(self):
        return (
            FollowRelation.objects.filter(
                followee=self.request.user, status=FollowRelation.Status.ACCEPTED
            )
            .select_related("follower", "followee")
            .order_by("follower__email")
        )

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.queryset_utils import excluding_stale_completions

from .models import Zikr
from .serializers import ZikrSerializer, ZikrSyncSerializer
from .services import sync_zikr_count
from .throttles import ZikrSyncThrottle


class ZikrListView(generics.ListAPIView):
    """Admin-curated, short list — never paginated (see apps.social's
    followers/following for the pattern used when a list *can* grow large).
    A completed zikr stays visible for 1 day after completed_at, then drops
    out — still-in-progress ones (completed_at is null) are never hidden."""

    serializer_class = ZikrSerializer
    pagination_class = None

    def get_queryset(self):
        return excluding_stale_completions(Zikr.objects.filter(is_active=True))


class ZikrSyncView(APIView):
    throttle_classes = [ZikrSyncThrottle]

    def post(self, request, pk):
        zikr = get_object_or_404(Zikr, pk=pk, is_active=True)
        serializer = ZikrSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        zikr = sync_zikr_count(request.user, zikr, serializer.validated_data["delta"])
        return Response(ZikrSerializer(zikr, context={"request": request}).data)

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Zikr
from .serializers import ZikrSerializer, ZikrSyncSerializer
from .services import sync_zikr_count
from .throttles import ZikrSyncThrottle


class ZikrListView(generics.ListAPIView):
    """Admin-curated, short list — never paginated (see apps.social's
    followers/following for the pattern used when a list *can* grow large)."""

    serializer_class = ZikrSerializer
    pagination_class = None
    queryset = Zikr.objects.filter(is_active=True)


class ZikrSyncView(APIView):
    throttle_classes = [ZikrSyncThrottle]

    def post(self, request, pk):
        zikr = get_object_or_404(Zikr, pk=pk, is_active=True)
        serializer = ZikrSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        zikr = sync_zikr_count(request.user, zikr, serializer.validated_data["delta"])
        return Response(ZikrSerializer(zikr, context={"request": request}).data)

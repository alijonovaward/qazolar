from django.urls import path

from . import views

urlpatterns = [
    path("zikr/", views.ZikrListView.as_view(), name="zikr-list"),
    path("zikr/<int:pk>/sync/", views.ZikrSyncView.as_view(), name="zikr-sync"),
]

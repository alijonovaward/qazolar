from django.urls import path

from . import views

urlpatterns = [
    path("zikr/", views.ZikrListView.as_view(), name="zikr-list"),
    path("zikr/completed-count/", views.ZikrCompletedCountView.as_view(), name="zikr-completed-count"),
    path("zikr/<int:pk>/sync/", views.ZikrSyncView.as_view(), name="zikr-sync"),
]

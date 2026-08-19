from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("qazo-records", views.QazoRecordViewSet, basename="qazo-record")

urlpatterns = [
    path("prayer-types/", views.PrayerTypeListView.as_view(), name="prayer-types"),
    path("qazo-setup/", views.QazoSetupListView.as_view(), name="qazo-setup-list"),
    path("qazo-setup/<str:code>/", views.QazoSetupUpsertView.as_view(), name="qazo-setup-upsert"),
    path("daily-logs/increment/", views.DailyLogIncrementView.as_view(), name="daily-log-increment"),
    path("daily-logs/", views.DailyLogListView.as_view(), name="daily-log-list"),
    path("tap-logs/", views.TapLogListView.as_view(), name="tap-log-list"),
    path("daily-goal/today/", views.DailyGoalTodayView.as_view(), name="daily-goal-today"),
    path("stats/forecast/", views.ForecastView.as_view(), name="stats-forecast"),
    path("stats/streak/", views.StreakView.as_view(), name="stats-streak"),
    path("stats/remaining-trend/", views.RemainingTrendView.as_view(), name="stats-remaining-trend"),
    path("stats/", views.StatsView.as_view(), name="stats"),
    path("", include(router.urls)),
]

from django.urls import path

from . import views

urlpatterns = [
    path("habits/", views.HabitListCreateView.as_view(), name="habit-list-create"),
    path("habits/<int:pk>/", views.HabitDetailView.as_view(), name="habit-detail"),
    path("habits/<int:pk>/add/", views.HabitAddProgressView.as_view(), name="habit-add-progress"),
    path("habits/<int:pk>/trend/", views.HabitTrendView.as_view(), name="habit-trend"),
    path(
        "collective-habits/",
        views.CollectiveHabitListView.as_view(),
        name="collective-habit-list",
    ),
    path(
        "collective-habits/<int:pk>/sync/",
        views.CollectiveHabitSyncView.as_view(),
        name="collective-habit-sync",
    ),
    path("shared-habits/", views.SharedHabitListCreateView.as_view(), name="shared-habit-list-create"),
    path(
        "shared-habits/<int:pk>/sync/",
        views.SharedHabitSyncView.as_view(),
        name="shared-habit-sync",
    ),
    path(
        "shared-habits/join/<str:token>/",
        views.SharedHabitJoinView.as_view(),
        name="shared-habit-join",
    ),
    path(
        "shared-habits/<int:pk>/invites/",
        views.SharedHabitInviteCreateView.as_view(),
        name="shared-habit-invite-create",
    ),
    path(
        "shared-habits/invites/incoming/",
        views.SharedHabitIncomingInvitesView.as_view(),
        name="shared-habit-invite-incoming",
    ),
    path(
        "shared-habits/invites/<int:pk>/accept/",
        views.SharedHabitInviteAcceptView.as_view(),
        name="shared-habit-invite-accept",
    ),
    path(
        "shared-habits/invites/<int:pk>/",
        views.SharedHabitInviteRemoveView.as_view(),
        name="shared-habit-invite-remove",
    ),
]

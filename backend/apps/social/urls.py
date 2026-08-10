from django.urls import path

from . import views

urlpatterns = [
    path(
        "social/follow-requests/",
        views.FollowRequestCreateView.as_view(),
        name="follow-request-create",
    ),
    path(
        "social/follow-requests/incoming/",
        views.IncomingFollowRequestsView.as_view(),
        name="follow-request-incoming",
    ),
    path(
        "social/follow-requests/<int:pk>/accept/",
        views.AcceptFollowRequestView.as_view(),
        name="follow-request-accept",
    ),
    path(
        "social/follow-requests/<int:pk>/",
        views.FollowRelationRemoveView.as_view(),
        name="follow-relation-remove",
    ),
    path("social/following/", views.FollowingListView.as_view(), name="social-following"),
    path("social/followers/", views.FollowersListView.as_view(), name="social-followers"),
]

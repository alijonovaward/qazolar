from django.urls import path

from . import views

urlpatterns = [
    path("habits/", views.HabitListCreateView.as_view(), name="habit-list-create"),
    path("habits/<int:pk>/", views.HabitDetailView.as_view(), name="habit-detail"),
    path("habits/<int:pk>/add/", views.HabitAddProgressView.as_view(), name="habit-add-progress"),
    path("habits/<int:pk>/trend/", views.HabitTrendView.as_view(), name="habit-trend"),
]

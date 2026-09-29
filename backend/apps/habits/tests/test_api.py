from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.habits.models import Habit, HabitLog

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_a():
    return User.objects.create(email="a@test.com")


@pytest.fixture
def user_b():
    return User.objects.create(email="b@test.com")


@pytest.fixture
def client_a(user_a):
    client = APIClient()
    client.force_authenticate(user=user_a)
    return client


@pytest.fixture
def client_b(user_b):
    client = APIClient()
    client.force_authenticate(user=user_b)
    return client


@pytest.fixture
def habit(user_a):
    return Habit.objects.create(user=user_a, name="Yurish", unit="qadam", daily_target=5000)


def add(client, habit_id, amount):
    return client.post(f"/api/habits/{habit_id}/add/", {"amount": amount}, format="json")


class TestHabitListCreate:
    def test_creates_a_habit_for_the_authenticated_user(self, client_a, user_a):
        response = client_a.post(
            "/api/habits/", {"name": "Kitob o'qish", "unit": "bet", "daily_target": 20}, format="json"
        )
        assert response.status_code == 201
        assert response.data["name"] == "Kitob o'qish"
        assert response.data["today_amount"] == 0
        assert Habit.objects.get().user == user_a

    def test_daily_target_is_optional(self, client_a):
        response = client_a.post("/api/habits/", {"name": "Meditatsiya", "unit": "daqiqa"}, format="json")
        assert response.status_code == 201
        assert response.data["daily_target"] is None
        assert response.data["percent_complete"] is None

    def test_only_lists_the_requesting_users_own_habits(self, client_a, client_b, user_b, habit):
        Habit.objects.create(user=user_b, name="Boshqaniki", unit="marta")
        response = client_a.get("/api/habits/")
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Yurish"

    def test_archived_habits_are_excluded_from_the_list(self, client_a, habit):
        habit.is_active = False
        habit.save()
        response = client_a.get("/api/habits/")
        assert response.data == []

    def test_is_not_paginated(self, client_a, habit):
        response = client_a.get("/api/habits/")
        assert isinstance(response.data, list)


class TestHabitAddProgress:
    def test_first_add_creates_todays_log(self, client_a, habit):
        response = add(client_a, habit.id, 2000)
        assert response.status_code == 200
        assert response.data["today_amount"] == 2000

    def test_repeated_adds_accumulate_within_the_same_day(self, client_a, habit):
        add(client_a, habit.id, 2000)
        response = add(client_a, habit.id, 3000)
        assert response.data["today_amount"] == 5000
        assert HabitLog.objects.filter(habit=habit).count() == 1

    def test_rejects_zero_or_negative_amount(self, client_a, habit):
        response = add(client_a, habit.id, 0)
        assert response.status_code == 400

    def test_cannot_add_to_another_users_habit(self, client_b, habit):
        response = add(client_b, habit.id, 100)
        assert response.status_code == 404
        assert not HabitLog.objects.filter(habit=habit).exists()

    def test_cannot_add_to_an_archived_habit(self, client_a, habit):
        habit.is_active = False
        habit.save()
        response = add(client_a, habit.id, 100)
        assert response.status_code == 404


class TestHabitSerializerFields:
    def test_percent_complete_is_capped_at_100(self, client_a, habit):
        add(client_a, habit.id, 9000)  # target is 5000
        response = client_a.get("/api/habits/")
        assert response.data[0]["percent_complete"] == 100.0

    def test_percent_complete_reflects_partial_progress(self, client_a, habit):
        add(client_a, habit.id, 2500)  # half of the 5000 target
        response = client_a.get("/api/habits/")
        assert response.data[0]["percent_complete"] == 50.0

    def test_current_streak_counts_consecutive_days_ending_today(self, client_a, habit):
        today = timezone.localdate()
        HabitLog.objects.create(habit=habit, date=today - timedelta(days=2), amount=1)
        HabitLog.objects.create(habit=habit, date=today - timedelta(days=1), amount=1)
        HabitLog.objects.create(habit=habit, date=today, amount=1)
        response = client_a.get("/api/habits/")
        assert response.data[0]["current_streak"] == 3

    def test_streak_breaks_on_a_gap_day(self, client_a, habit):
        today = timezone.localdate()
        HabitLog.objects.create(habit=habit, date=today - timedelta(days=2), amount=1)
        # yesterday skipped
        HabitLog.objects.create(habit=habit, date=today, amount=1)
        response = client_a.get("/api/habits/")
        assert response.data[0]["current_streak"] == 1


class TestHabitDetail:
    def test_owner_can_rename(self, client_a, habit):
        response = client_a.patch(f"/api/habits/{habit.id}/", {"name": "Yugurish"}, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Yugurish"

    def test_owner_can_archive(self, client_a, habit):
        response = client_a.patch(f"/api/habits/{habit.id}/", {"is_active": False}, format="json")
        assert response.status_code == 200
        assert client_a.get("/api/habits/").data == []

    def test_owner_can_delete(self, client_a, habit):
        response = client_a.delete(f"/api/habits/{habit.id}/")
        assert response.status_code == 204
        assert not Habit.objects.filter(id=habit.id).exists()

    def test_non_owner_cannot_see_or_edit(self, client_b, habit):
        assert client_b.get(f"/api/habits/{habit.id}/").status_code == 404
        assert client_b.patch(f"/api/habits/{habit.id}/", {"name": "x"}, format="json").status_code == 404


class TestHabitTrend:
    def test_returns_a_fixed_14_day_window_oldest_first(self, client_a, habit):
        today = timezone.localdate()
        response = client_a.get(f"/api/habits/{habit.id}/trend/")
        assert response.status_code == 200
        assert len(response.data) == 14
        assert response.data[0]["date"] == (today - timedelta(days=13)).isoformat()
        assert response.data[-1]["date"] == today.isoformat()

    def test_days_with_no_activity_are_zero_filled_not_skipped(self, client_a, habit):
        add(client_a, habit.id, 1000)  # only today has a log
        response = client_a.get(f"/api/habits/{habit.id}/trend/")
        amounts = [row["amount"] for row in response.data]
        assert amounts[-1] == 1000
        assert amounts[:-1] == [0] * 13

    def test_non_owner_cannot_see_someone_elses_habit_trend(self, client_b, habit):
        response = client_b.get(f"/api/habits/{habit.id}/trend/")
        assert response.status_code == 404

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.habits.models import (
    CollectiveHabit,
    Habit,
    HabitLog,
    SharedHabit,
    SharedHabitInvite,
    SharedHabitMember,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_a():
    return User.objects.create(email="a@test.com", username="user_a")


@pytest.fixture
def user_b():
    return User.objects.create(email="b@test.com", username="user_b")


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
def user_c():
    return User.objects.create(email="c@test.com", username="user_c")


@pytest.fixture
def client_c(user_c):
    client = APIClient()
    client.force_authenticate(user=user_c)
    return client


@pytest.fixture
def habit(user_a):
    return Habit.objects.create(user=user_a, name="Yurish", unit="qadam", daily_target=5000)


def add(client, habit_id, amount):
    return client.post(f"/api/habits/{habit_id}/add/", {"amount": amount}, format="json")


@pytest.fixture
def collective_habit():
    return CollectiveHabit.objects.create(name="Jamoaviy yurish", unit="qadam", target_count=1000)


def sync_collective(client, collective_habit_id, delta):
    return client.post(
        f"/api/collective-habits/{collective_habit_id}/sync/", {"delta": delta}, format="json"
    )


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


class TestCollectiveHabitList:
    def test_lists_active_collective_habits(self, client_a, collective_habit):
        response = client_a.get("/api/collective-habits/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Jamoaviy yurish"

    def test_hides_inactive_collective_habits(self, client_a, collective_habit):
        collective_habit.is_active = False
        collective_habit.save()
        response = client_a.get("/api/collective-habits/")
        assert response.data == []

    def test_is_not_paginated(self, client_a, collective_habit):
        response = client_a.get("/api/collective-habits/")
        assert isinstance(response.data, list)

    def test_completed_more_than_a_day_ago_is_hidden(self, client_a, collective_habit):
        collective_habit.completed_at = timezone.now() - timedelta(days=2)
        collective_habit.save()
        response = client_a.get("/api/collective-habits/")
        assert response.data == []


class TestCollectiveHabitSync:
    def test_increments_the_shared_total(self, client_a, collective_habit):
        response = sync_collective(client_a, collective_habit.id, 50)
        assert response.status_code == 200
        assert response.data["current_count"] == 50

    def test_is_cumulative_across_different_users(self, client_a, client_b, collective_habit):
        sync_collective(client_a, collective_habit.id, 50)
        response = sync_collective(client_b, collective_habit.id, 30)
        assert response.data["current_count"] == 80

    def test_tracks_each_users_own_contribution_separately(
        self, client_a, client_b, collective_habit, user_a, user_b
    ):
        sync_collective(client_a, collective_habit.id, 50)
        sync_collective(client_b, collective_habit.id, 30)
        response = client_a.get("/api/collective-habits/")
        assert response.data[0]["my_count"] == 50

    def test_current_count_is_clamped_at_the_target(self, client_a, collective_habit):
        response = sync_collective(client_a, collective_habit.id, 5000)  # target is 1000
        assert response.data["current_count"] == 1000
        assert response.data["percent_complete"] == 100.0

    def test_sets_completed_at_once_the_target_is_reached(self, client_a, collective_habit):
        response = sync_collective(client_a, collective_habit.id, 1000)
        assert response.data["completed_at"] is not None

    def test_rejects_zero_or_negative_delta(self, client_a, collective_habit):
        response = sync_collective(client_a, collective_habit.id, 0)
        assert response.status_code == 400

    def test_404_for_inactive_collective_habit(self, client_a, collective_habit):
        collective_habit.is_active = False
        collective_habit.save()
        response = sync_collective(client_a, collective_habit.id, 10)
        assert response.status_code == 404


class TestCollectiveHabitTopContributors:
    def test_ranks_contributors_by_count_descending(
        self, client_a, client_b, collective_habit, user_b
    ):
        sync_collective(client_a, collective_habit.id, 10)
        sync_collective(client_b, collective_habit.id, 30)
        response = client_a.get("/api/collective-habits/")
        top = response.data[0]["top_contributors"]
        assert [row["count"] for row in top] == [30, 10]
        assert top[0]["user"]["id"] == user_b.id

    def test_excludes_zero_contributors(self, client_a, collective_habit):
        response = client_a.get("/api/collective-habits/")
        assert response.data[0]["top_contributors"] == []


def create_shared(client, name="Jamoaviy o'qish", unit="bet", target_count=200):
    return client.post(
        "/api/shared-habits/", {"name": name, "unit": unit, "target_count": target_count}, format="json"
    )


def sync_shared(client, shared_habit_id, delta):
    return client.post(f"/api/shared-habits/{shared_habit_id}/sync/", {"delta": delta}, format="json")


def invite(client, shared_habit_id, username):
    return client.post(
        f"/api/shared-habits/{shared_habit_id}/invites/", {"username": username}, format="json"
    )


class TestSharedHabitCreate:
    def test_creator_becomes_a_member_automatically(self, client_a, user_a):
        response = create_shared(client_a)
        assert response.status_code == 201
        shared_habit_id = response.data["id"]
        assert SharedHabitMember.objects.filter(shared_habit_id=shared_habit_id, user=user_a).exists()
        assert response.data["is_creator"] is True
        assert response.data["participant_count"] == 1

    def test_never_shown_to_an_uninvolved_user(self, client_a, client_b):
        create_shared(client_a)
        response = client_b.get("/api/shared-habits/")
        # unlike CollectiveHabit, this is never a public/open list
        assert response.data == []

    def test_creator_sees_it_in_their_own_list(self, client_a):
        create_shared(client_a)
        response = client_a.get("/api/shared-habits/")
        assert len(response.data) == 1

    def test_has_a_unique_invite_token(self, client_a):
        first = create_shared(client_a, name="A")
        second = create_shared(client_a, name="B")
        assert first.data["invite_token"] != second.data["invite_token"]


class TestSharedHabitSync:
    def test_a_member_can_add_progress(self, client_a):
        shared_habit_id = create_shared(client_a, target_count=1000).data["id"]
        response = sync_shared(client_a, shared_habit_id, 50)
        assert response.status_code == 200
        assert response.data["current_count"] == 50
        assert response.data["my_count"] == 50

    def test_a_non_member_cannot_add_progress(self, client_a, client_b):
        shared_habit_id = create_shared(client_a).data["id"]
        response = sync_shared(client_b, shared_habit_id, 10)
        assert response.status_code == 404

    def test_is_cumulative_across_members(self, client_a, client_b, user_b):
        shared_habit_id = create_shared(client_a, target_count=1000).data["id"]
        SharedHabitMember.objects.create(
            shared_habit_id=shared_habit_id, user=user_b
        )  # joined some other way
        sync_shared(client_a, shared_habit_id, 40)
        response = sync_shared(client_b, shared_habit_id, 30)
        assert response.data["current_count"] == 70

    def test_clamped_at_target_and_sets_completed_at(self, client_a):
        shared_habit_id = create_shared(client_a, target_count=100).data["id"]
        response = sync_shared(client_a, shared_habit_id, 500)
        assert response.data["current_count"] == 100
        assert response.data["completed_at"] is not None


class TestSharedHabitJoinByLink:
    def test_join_via_token_creates_membership(self, client_a, client_b, user_b):
        created = create_shared(client_a)
        token = created.data["invite_token"]
        response = client_b.post(f"/api/shared-habits/join/{token}/")
        assert response.status_code == 200
        assert SharedHabitMember.objects.filter(
            shared_habit_id=created.data["id"], user=user_b
        ).exists()

    def test_joining_appears_in_the_joiners_own_list(self, client_a, client_b):
        created = create_shared(client_a)
        client_b.post(f"/api/shared-habits/join/{created.data['invite_token']}/")
        response = client_b.get("/api/shared-habits/")
        assert len(response.data) == 1
        assert response.data[0]["is_creator"] is False

    def test_joining_twice_does_not_error(self, client_a, client_b):
        created = create_shared(client_a)
        token = created.data["invite_token"]
        client_b.post(f"/api/shared-habits/join/{token}/")
        response = client_b.post(f"/api/shared-habits/join/{token}/")
        assert response.status_code == 200

    def test_unknown_token_404s(self, client_a):
        response = client_a.post("/api/shared-habits/join/does-not-exist/")
        assert response.status_code == 404


class TestSharedHabitInvite:
    def test_creator_can_invite_by_username(self, client_a, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        response = invite(client_a, shared_habit_id, user_b.username)
        assert response.status_code == 201
        assert response.data["invitee"]["id"] == user_b.id

    def test_non_creator_member_cannot_invite(self, client_a, client_b, client_c, user_c):
        created = create_shared(client_a)
        client_b.post(f"/api/shared-habits/join/{created.data['invite_token']}/")
        response = invite(client_b, created.data["id"], user_c.username)
        assert response.status_code == 404

    def test_cannot_invite_an_already_invited_user(self, client_a, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite(client_a, shared_habit_id, user_b.username)
        response = invite(client_a, shared_habit_id, user_b.username)
        assert response.status_code == 400

    def test_cannot_invite_an_existing_member(self, client_a, client_b, user_b):
        created = create_shared(client_a)
        client_b.post(f"/api/shared-habits/join/{created.data['invite_token']}/")
        response = invite(client_a, created.data["id"], user_b.username)
        assert response.status_code == 400

    def test_cannot_invite_nonexistent_username(self, client_a):
        shared_habit_id = create_shared(client_a).data["id"]
        response = invite(client_a, shared_habit_id, "nobody_here")
        assert response.status_code == 404

    def test_invitee_sees_it_in_incoming(self, client_a, client_b, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite(client_a, shared_habit_id, user_b.username)
        response = client_b.get("/api/shared-habits/invites/incoming/")
        assert len(response.data) == 1
        assert response.data[0]["shared_habit"]["id"] == shared_habit_id

    def test_inviter_does_not_see_it_in_their_own_incoming(self, client_a, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite(client_a, shared_habit_id, user_b.username)
        response = client_a.get("/api/shared-habits/invites/incoming/")
        assert response.data == []

    def test_accepting_creates_membership_and_removes_the_invite(self, client_a, client_b, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite_id = invite(client_a, shared_habit_id, user_b.username).data["id"]
        response = client_b.post(f"/api/shared-habits/invites/{invite_id}/accept/")
        assert response.status_code == 200
        assert SharedHabitMember.objects.filter(shared_habit_id=shared_habit_id, user=user_b).exists()
        assert not SharedHabitInvite.objects.filter(id=invite_id).exists()

    def test_invitee_can_decline(self, client_a, client_b, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite_id = invite(client_a, shared_habit_id, user_b.username).data["id"]
        response = client_b.delete(f"/api/shared-habits/invites/{invite_id}/")
        assert response.status_code == 204
        assert not SharedHabitMember.objects.filter(shared_habit_id=shared_habit_id, user=user_b).exists()

    def test_inviter_can_cancel(self, client_a, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite_id = invite(client_a, shared_habit_id, user_b.username).data["id"]
        response = client_a.delete(f"/api/shared-habits/invites/{invite_id}/")
        assert response.status_code == 204

    def test_uninvolved_user_cannot_remove_someone_elses_invite(self, client_a, client_c, user_b):
        shared_habit_id = create_shared(client_a).data["id"]
        invite_id = invite(client_a, shared_habit_id, user_b.username).data["id"]
        response = client_c.delete(f"/api/shared-habits/invites/{invite_id}/")
        assert response.status_code == 404
        assert SharedHabitInvite.objects.filter(id=invite_id).exists()

    def test_accepting_frees_up_a_fresh_invite_later(self, client_a, client_b, user_b):
        # not a realistic flow (already a member), but confirms the invite
        # row itself doesn't linger and block a future re-invite scenario
        shared_habit_id = create_shared(client_a).data["id"]
        invite_id = invite(client_a, shared_habit_id, user_b.username).data["id"]
        client_b.post(f"/api/shared-habits/invites/{invite_id}/accept/")
        assert SharedHabitInvite.objects.filter(shared_habit_id=shared_habit_id).count() == 0

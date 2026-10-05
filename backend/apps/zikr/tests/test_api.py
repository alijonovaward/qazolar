from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.zikr.models import UserZikrCount, Zikr

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
def zikr():
    return Zikr.objects.create(
        arabic_text="لَا إِلَٰهَ إِلَّا اللَّٰهُ",
        transliteration="Laa ilaaha illalloh",
        translation="Allohdan o'zga iloh yo'q",
        target_count=1000,
    )


def sync(client, zikr_id, delta):
    return client.post(f"/api/zikr/{zikr_id}/sync/", {"delta": delta}, format="json")


class TestZikrList:
    def test_lists_active_zikrs(self, client_a, zikr):
        response = client_a.get("/api/zikr/")
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["transliteration"] == "Laa ilaaha illalloh"

    def test_hides_inactive_zikrs(self, client_a, zikr):
        zikr.is_active = False
        zikr.save()
        response = client_a.get("/api/zikr/")
        assert response.data == []

    def test_is_not_paginated(self, client_a, zikr):
        response = client_a.get("/api/zikr/")
        # a plain list/array, not a {count, results} envelope
        assert isinstance(response.data, list)

    def test_in_progress_zikr_is_always_shown_regardless_of_age(self, client_a, zikr):
        zikr.created_at = timezone.now() - timedelta(days=400)
        zikr.save(update_fields=["created_at"])
        response = client_a.get("/api/zikr/")
        assert len(response.data) == 1

    def test_completed_within_the_last_day_is_still_shown(self, client_a, zikr):
        zikr.completed_at = timezone.now() - timedelta(hours=12)
        zikr.save(update_fields=["completed_at"])
        response = client_a.get("/api/zikr/")
        assert len(response.data) == 1

    def test_completed_more_than_a_day_ago_is_hidden(self, client_a, zikr):
        zikr.completed_at = timezone.now() - timedelta(days=2)
        zikr.save(update_fields=["completed_at"])
        response = client_a.get("/api/zikr/")
        assert response.data == []


class TestZikrTopContributors:
    def test_ranks_contributors_by_count_descending(self, client_a, client_b, zikr, user_a, user_b):
        sync(client_a, zikr.id, 10)
        sync(client_b, zikr.id, 30)
        response = client_a.get("/api/zikr/")
        top = response.data[0]["top_contributors"]
        assert [row["count"] for row in top] == [30, 10]
        assert top[0]["user"]["id"] == user_b.id

    def test_caps_at_ten_even_with_more_contributors(self, client_a, zikr):
        users = [User.objects.create(email=f"contributor{i}@test.com") for i in range(12)]
        for i, user in enumerate(users):
            client = APIClient()
            client.force_authenticate(user=user)
            sync(client, zikr.id, i + 1)

        response = client_a.get("/api/zikr/")
        top = response.data[0]["top_contributors"]
        assert len(top) == 10
        assert [row["count"] for row in top] == [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]

    def test_excludes_zero_contributors(self, client_a, zikr):
        # user_a authenticates but never taps — shouldn't appear as a
        # zero-count "contributor"
        response = client_a.get("/api/zikr/")
        assert response.data[0]["top_contributors"] == []

    def test_shows_username_when_set_email_otherwise(self, client_a, client_b, zikr, user_b):
        user_b.username = "zikr_master"
        user_b.save()
        sync(client_b, zikr.id, 5)
        response = client_a.get("/api/zikr/")
        top = response.data[0]["top_contributors"]
        assert top[0]["user"]["username"] == "zikr_master"

    def test_my_rank_is_null_without_any_contribution(self, client_a, zikr):
        response = client_a.get("/api/zikr/")
        assert response.data[0]["my_rank"] is None

    def test_my_rank_reflects_position_among_contributors(self, client_a, client_b, zikr):
        sync(client_a, zikr.id, 10)
        sync(client_b, zikr.id, 30)
        response = client_a.get("/api/zikr/")
        assert response.data[0]["my_rank"] == 2

    def test_tied_counts_share_a_rank(self, client_a, client_b, zikr):
        sync(client_a, zikr.id, 20)
        sync(client_b, zikr.id, 20)
        response = client_a.get("/api/zikr/")
        assert response.data[0]["my_rank"] == 1


class TestZikrSync:
    def test_increments_the_collective_total(self, client_a, zikr):
        response = sync(client_a, zikr.id, 50)
        assert response.status_code == 200
        assert response.data["current_count"] == 50

    def test_is_cumulative_across_multiple_syncs(self, client_a, zikr):
        sync(client_a, zikr.id, 50)
        response = sync(client_a, zikr.id, 30)
        assert response.data["current_count"] == 80

    def test_is_cumulative_across_different_users(self, client_a, client_b, zikr):
        sync(client_a, zikr.id, 50)
        response = sync(client_b, zikr.id, 30)
        assert response.data["current_count"] == 80

    def test_tracks_each_users_own_contribution_separately(self, client_a, client_b, zikr, user_a, user_b):
        sync(client_a, zikr.id, 50)
        sync(client_b, zikr.id, 30)
        assert UserZikrCount.objects.get(user=user_a, zikr=zikr).count == 50
        assert UserZikrCount.objects.get(user=user_b, zikr=zikr).count == 30

    def test_participant_count_reflects_distinct_contributors(self, client_a, client_b, zikr):
        sync(client_a, zikr.id, 10)
        response = sync(client_b, zikr.id, 10)
        assert response.data["participant_count"] == 2

    def test_my_count_reflects_the_requesting_users_total(self, client_a, zikr):
        sync(client_a, zikr.id, 10)
        response = sync(client_a, zikr.id, 5)
        assert response.data["my_count"] == 15

    def test_percent_and_remaining_are_computed_from_the_target(self, client_a, zikr):
        response = sync(client_a, zikr.id, 250)
        assert response.data["percent_complete"] == 25.0
        assert response.data["remaining"] == 750

    def test_current_count_is_clamped_at_the_target(self, client_a, zikr):
        response = sync(client_a, zikr.id, 5000)  # well past target_count=1000
        assert response.data["percent_complete"] == 100.0
        assert response.data["remaining"] == 0
        assert response.data["current_count"] == 1000

    def test_a_batch_crossing_the_target_only_credits_the_remaining_capacity(
        self, client_a, zikr, user_a
    ):
        sync(client_a, zikr.id, 990)
        response = sync(client_a, zikr.id, 50)  # only 10 needed to hit 1000
        assert response.data["current_count"] == 1000
        # the user's own tally reflects what was actually credited, not the
        # raw 50 they tried to add
        assert UserZikrCount.objects.get(user=user_a, zikr=zikr).count == 1000

    def test_sync_is_a_no_op_once_the_target_is_already_reached(self, client_a, zikr):
        sync(client_a, zikr.id, 1000)
        response = sync(client_a, zikr.id, 10)
        assert response.data["current_count"] == 1000

    def test_delta_is_capped_per_call(self, client_a):
        # a target large enough that MAX_SYNC_DELTA, not the target, is the
        # thing doing the clamping in this test
        big_zikr = Zikr.objects.create(
            arabic_text="سُبْحَانَ اللَّهِ",
            transliteration="Subhanalloh",
            translation="Alloh pok",
            target_count=1_000_000,
        )
        response = sync(client_a, big_zikr.id, 999_999)
        assert response.data["current_count"] == 5000  # MAX_SYNC_DELTA

    def test_rejects_zero_or_negative_delta(self, client_a, zikr):
        response = sync(client_a, zikr.id, 0)
        assert response.status_code == 400

    def test_404_for_inactive_zikr(self, client_a, zikr):
        zikr.is_active = False
        zikr.save()
        response = sync(client_a, zikr.id, 10)
        assert response.status_code == 404

    def test_404_for_nonexistent_zikr(self, client_a):
        response = sync(client_a, 999999, 10)
        assert response.status_code == 404

    def test_completed_at_is_null_while_in_progress(self, client_a, zikr):
        response = sync(client_a, zikr.id, 250)
        assert response.data["completed_at"] is None
        assert response.data["duration_days"] is None

    def test_completed_at_is_set_once_the_target_is_reached(self, client_a, zikr):
        response = sync(client_a, zikr.id, 1000)
        assert response.data["completed_at"] is not None
        assert response.data["duration_days"] == 0  # created and completed the same test run

    def test_completed_at_is_not_overwritten_by_a_later_no_op_sync(self, client_a, zikr):
        sync(client_a, zikr.id, 1000)
        zikr.refresh_from_db()
        first_completed_at = zikr.completed_at

        sync(client_a, zikr.id, 10)  # no-op — already at target
        zikr.refresh_from_db()
        assert zikr.completed_at == first_completed_at


class TestZikrListQueryCount:
    def _query_count(self, client):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as ctx:
            response = client.get("/api/zikr/")
        assert response.status_code == 200
        return len(ctx.captured_queries), response

    def test_query_count_does_not_grow_with_list_size(self, client_a, user_a, user_b):
        def make_zikr(i):
            z = Zikr.objects.create(
                arabic_text="x", transliteration=f"z{i}", translation="t", target_count=1000
            )
            UserZikrCount.objects.create(zikr=z, user=user_a, count=5)
            UserZikrCount.objects.create(zikr=z, user=user_b, count=9)
            return z

        make_zikr(0)
        baseline, _ = self._query_count(client_a)
        for i in range(1, 6):
            make_zikr(i)
        with_six, response = self._query_count(client_a)

        assert with_six == baseline
        assert len(response.data) == 6
        first = response.data[0]
        assert first["participant_count"] == 2
        assert first["my_count"] == 5
        assert first["my_rank"] == 2
        assert [c["count"] for c in first["top_contributors"]] == [9, 5]

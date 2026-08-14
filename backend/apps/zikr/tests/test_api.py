import pytest
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

    def test_percent_never_exceeds_100_past_the_target(self, client_a, zikr):
        response = sync(client_a, zikr.id, 5000)  # well past target_count=1000
        assert response.data["percent_complete"] == 100.0
        assert response.data["remaining"] == 0
        # the raw count itself isn't clamped — over-achieving is fine
        assert response.data["current_count"] == 5000

    def test_delta_is_capped_per_call(self, client_a, zikr):
        response = sync(client_a, zikr.id, 999_999)
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

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.prayers.models import PrayerType, QazoRecord
from apps.social.models import FollowRelation

pytestmark = pytest.mark.django_db


@pytest.fixture
def prayer_types():
    PrayerType.objects.get_or_create(
        code="bomdod", defaults={"name": "Bomdod", "order": 1, "rakat_count": 2, "qasr_rakat_count": 2}
    )
    PrayerType.objects.get_or_create(
        code="peshin", defaults={"name": "Peshin", "order": 2, "rakat_count": 4, "qasr_rakat_count": 2}
    )
    return {pt.code: pt for pt in PrayerType.objects.all()}


@pytest.fixture
def user_a():
    return User.objects.create(email="a@test.com", username="user_a", gender=User.Gender.MALE)


@pytest.fixture
def user_b():
    return User.objects.create(email="b@test.com", username="user_b", gender=User.Gender.MALE)


@pytest.fixture
def user_c():
    return User.objects.create(email="c@test.com", username="user_c", gender=User.Gender.MALE)


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
def client_c(user_c):
    client = APIClient()
    client.force_authenticate(user=user_c)
    return client


def follow(client, username):
    return client.post("/api/social/follow-requests/", {"username": username}, format="json")


class TestFollowRequestCreate:
    def test_creates_a_pending_request(self, client_a, user_a, user_b):
        response = follow(client_a, user_b.username)
        assert response.status_code == 201
        assert response.data["status"] == "pending"
        assert response.data["follower"]["id"] == user_a.id
        assert response.data["followee"]["id"] == user_b.id
        relation = FollowRelation.objects.get()
        assert relation.status == FollowRelation.Status.PENDING

    def test_lookup_is_case_insensitive_and_ignores_a_leading_at(self, client_a, user_b):
        response = follow(client_a, f"@{user_b.username.upper()}")
        assert response.status_code == 201

    def test_cannot_follow_self(self, client_a, user_a):
        response = follow(client_a, user_a.username)
        assert response.status_code == 400

    def test_cannot_follow_nonexistent_username(self, client_a):
        response = follow(client_a, "nobody_here")
        assert response.status_code == 404

    def test_cannot_follow_a_user_without_a_username_set(self, client_a):
        response = follow(client_a, "")
        assert response.status_code in (400, 404)

    def test_cannot_send_duplicate_request(self, client_a, user_b):
        follow(client_a, user_b.username)
        response = follow(client_a, user_b.username)
        assert response.status_code == 400

    def test_cannot_re_request_while_already_accepted(self, client_a, client_b, user_a, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")
        response = follow(client_a, user_b.username)
        assert response.status_code == 400


class TestFollowRequestAccept:
    def test_followee_can_accept(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")
        assert response.status_code == 200
        assert response.data["status"] == "accepted"

    def test_non_followee_cannot_accept(self, client_a, client_c, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_c.post(f"/api/social/follow-requests/{rel_id}/accept/")
        assert response.status_code == 404

    def test_follower_cannot_accept_their_own_sent_request(self, client_a, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_a.post(f"/api/social/follow-requests/{rel_id}/accept/")
        assert response.status_code == 404


class TestIncomingRequests:
    def test_only_shows_pending_requests_addressed_to_me(self, client_a, client_b, user_a, user_b):
        follow(client_a, user_b.username)
        response = client_b.get("/api/social/follow-requests/incoming/")
        assert response.data["count"] == 1
        assert response.data["results"][0]["follower"]["id"] == user_a.id

    def test_follower_does_not_see_it_in_their_own_incoming(self, client_a, user_b):
        follow(client_a, user_b.username)
        response = client_a.get("/api/social/follow-requests/incoming/")
        assert response.data["count"] == 0


class TestFollowRelationRemove:
    def test_followee_can_decline_a_pending_request(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_b.delete(f"/api/social/follow-requests/{rel_id}/")
        assert response.status_code == 204
        assert not FollowRelation.objects.exists()

    def test_follower_can_cancel_their_own_pending_request(self, client_a, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_a.delete(f"/api/social/follow-requests/{rel_id}/")
        assert response.status_code == 204

    def test_either_side_can_remove_an_accepted_relation(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")
        response = client_b.delete(f"/api/social/follow-requests/{rel_id}/")
        assert response.status_code == 204
        assert not FollowRelation.objects.exists()

    def test_uninvolved_user_cannot_remove_someone_elses_relation(self, client_a, client_c, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_c.delete(f"/api/social/follow-requests/{rel_id}/")
        assert response.status_code == 404
        assert FollowRelation.objects.exists()

    def test_declining_frees_up_the_pair_for_a_fresh_request(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        client_b.delete(f"/api/social/follow-requests/{rel_id}/")
        response = follow(client_a, user_b.username)
        assert response.status_code == 201


class TestFollowingVisibility:
    def _accept(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")

    def _seed_progress(self, prayer_types, user_b):
        record = QazoRecord.objects.create(
            user=user_b, prayer_type=prayer_types["bomdod"], hazar_missed=10, hazar_completed=4
        )
        return record

    def test_pending_request_leaks_nothing_in_following_list(self, client_a, user_b):
        follow(client_a, user_b.username)
        response = client_a.get("/api/social/following/")
        assert response.data["count"] == 0

    def test_percent_only_shows_percent_and_streak_but_not_per_prayer_counts(
        self, prayer_types, client_a, client_b, user_a, user_b
    ):
        user_b.follower_visibility = User.VisibilityLevel.PERCENT_ONLY
        user_b.save()
        self._seed_progress(prayer_types, user_b)
        self._accept(client_a, client_b, user_b)

        response = client_a.get("/api/social/following/")
        profile = response.data["results"][0]["followee_profile"]
        assert profile["visibility"] == "percent_only"
        assert profile["percent_complete"] == 40.0
        assert "records" not in profile

    def test_full_shows_per_prayer_records(self, prayer_types, client_a, client_b, user_a, user_b):
        user_b.follower_visibility = User.VisibilityLevel.FULL
        user_b.save()
        self._seed_progress(prayer_types, user_b)
        self._accept(client_a, client_b, user_b)

        response = client_a.get("/api/social/following/")
        profile = response.data["results"][0]["followee_profile"]
        assert profile["visibility"] == "full"
        assert profile["records"][0]["hazar_missed"] == 10

    def test_none_shows_nothing_but_visibility_flag(
        self, prayer_types, client_a, client_b, user_a, user_b
    ):
        user_b.follower_visibility = User.VisibilityLevel.NONE
        user_b.save()
        self._seed_progress(prayer_types, user_b)
        self._accept(client_a, client_b, user_b)

        response = client_a.get("/api/social/following/")
        profile = response.data["results"][0]["followee_profile"]
        assert profile == {"visibility": "none"}


class TestFolloweeRemainingTrend:
    def _accept(self, client_a, client_b, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")
        return rel_id

    def test_percent_only_can_still_see_the_trend(self, client_a, client_b, user_b):
        user_b.follower_visibility = User.VisibilityLevel.PERCENT_ONLY
        user_b.save()
        rel_id = self._accept(client_a, client_b, user_b)
        response = client_a.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 200
        assert isinstance(response.data, list)

    def test_full_can_see_the_trend(self, client_a, client_b, user_b):
        user_b.follower_visibility = User.VisibilityLevel.FULL
        user_b.save()
        rel_id = self._accept(client_a, client_b, user_b)
        response = client_a.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 200

    def test_none_visibility_is_forbidden(self, client_a, client_b, user_b):
        user_b.follower_visibility = User.VisibilityLevel.NONE
        user_b.save()
        rel_id = self._accept(client_a, client_b, user_b)
        response = client_a.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 403

    def test_pending_relation_is_not_visible_yet(self, client_a, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_a.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 404

    def test_uninvolved_user_cannot_see_someone_elses_followee_trend(
        self, client_a, client_c, user_b
    ):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_c.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 404

    def test_followee_cannot_use_the_relation_from_the_other_side(self, client_a, client_b, user_b):
        rel_id = self._accept(client_a, client_b, user_b)
        # this endpoint is "what I, the follower, see about them" — the
        # followee hitting their own relation id isn't the follower on it
        response = client_b.get(f"/api/social/following/{rel_id}/remaining-trend/")
        assert response.status_code == 404

    def test_rejects_bad_period(self, client_a, client_b, user_b):
        rel_id = self._accept(client_a, client_b, user_b)
        response = client_a.get(f"/api/social/following/{rel_id}/remaining-trend/?period=bogus")
        assert response.status_code == 400


class TestFollowersList:
    def test_shows_accepted_followers_only(self, client_a, client_b, user_a, user_b):
        rel_id = follow(client_a, user_b.username).data["id"]
        response = client_b.get("/api/social/followers/")
        assert response.data["count"] == 0  # still pending

        client_b.post(f"/api/social/follow-requests/{rel_id}/accept/")
        response = client_b.get("/api/social/followers/")
        assert response.data["count"] == 1
        assert response.data["results"][0]["follower"]["id"] == user_a.id

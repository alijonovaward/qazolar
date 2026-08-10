from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.prayers.models import InitialQazoSetup, PrayerType, QazoRecord
from apps.prayers.services.daily_log import increment_daily_log
from apps.prayers.services.setup import apply_setup

pytestmark = pytest.mark.django_db


@pytest.fixture
def prayer_types():
    PrayerType.objects.get_or_create(
        code="bomdod", defaults={"name": "Bomdod", "order": 1, "rakat_count": 2, "qasr_rakat_count": 2}
    )
    PrayerType.objects.get_or_create(
        code="peshin", defaults={"name": "Peshin", "order": 2, "rakat_count": 4, "qasr_rakat_count": 2}
    )
    PrayerType.objects.get_or_create(
        code="asr", defaults={"name": "Asr", "order": 3, "rakat_count": 4, "qasr_rakat_count": 2}
    )
    PrayerType.objects.get_or_create(
        code="shom", defaults={"name": "Shom", "order": 4, "rakat_count": 3, "qasr_rakat_count": 3}
    )
    PrayerType.objects.get_or_create(
        code="xufton", defaults={"name": "Xufton", "order": 5, "rakat_count": 4, "qasr_rakat_count": 2}
    )
    return {pt.code: pt for pt in PrayerType.objects.all()}


@pytest.fixture
def user_a():
    return User.objects.create(email="a@test.com", gender=User.Gender.MALE)


@pytest.fixture
def user_b():
    return User.objects.create(email="b@test.com", gender=User.Gender.MALE)


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


class TestPrayerTypesEndpoint:
    def test_lists_five_prayer_types_in_order(self, prayer_types, client_a):
        response = client_a.get("/api/prayer-types/")
        assert response.status_code == 200
        codes = [row["code"] for row in response.data["results"]]
        assert codes == ["bomdod", "peshin", "asr", "shom", "xufton", "vitr"]

    def test_requires_authentication(self, prayer_types):
        response = APIClient().get("/api/prayer-types/")
        assert response.status_code == 401


class TestQazoSetupUpsert:
    def test_upsert_creates_setup_and_record(self, prayer_types, client_a):
        response = client_a.put(
            "/api/qazo-setup/peshin/",
            {"status": "owes_qazo", "hazar_manual_override_count": 30},
            format="json",
        )
        assert response.status_code == 200
        record = QazoRecord.objects.get(user__email="a@test.com", prayer_type__code="peshin")
        assert record.total_missed == 30

    def test_upsert_is_idempotent_per_prayer(self, prayer_types, client_a, user_a):
        client_a.put(
            "/api/qazo-setup/peshin/",
            {"status": "owes_qazo", "hazar_manual_override_count": 30},
            format="json",
        )
        client_a.put(
            "/api/qazo-setup/peshin/",
            {"status": "consistent", "hazar_manual_override_count": None},
            format="json",
        )
        assert InitialQazoSetup.objects.filter(user=user_a, prayer_type__code="peshin").count() == 1

    def test_upsert_without_manual_count_succeeds(self, prayer_types, client_a, user_a):
        response = client_a.put(
            "/api/qazo-setup/asr/",
            {"status": "owes_qazo", "hazar_manual_override_count": None},
            format="json",
        )
        assert response.status_code == 200
        record = QazoRecord.objects.get(user=user_a, prayer_type__code="asr")
        assert record.total_missed == 0


class TestQazoRecordsEndpoint:
    def test_summary_matches_hand_calculation(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        for code, status_, manual in [
            ("bomdod", "consistent", None),
            ("peshin", "owes_qazo", 30),
            ("asr", "owes_qazo", 50),
        ]:
            setup = InitialQazoSetup.objects.create(
                user=user_a,
                prayer_type=prayer_types[code],
                status=status_,
                hazar_manual_override_count=manual,
            )
            apply_setup(setup)
        for _ in range(20):
            increment_daily_log(user_a, prayer_types["peshin"], today, "hazar_completed")

        response = client_a.get("/api/qazo-records/summary/")
        assert response.status_code == 200
        assert response.data["total_missed"] == 80  # 0+30+50
        assert response.data["total_completed"] == 20

    def test_user_cannot_see_another_users_records(self, prayer_types, client_a, client_b, user_b):
        setup = InitialQazoSetup.objects.create(
            user=user_b,
            prayer_type=prayer_types["peshin"],
            status="owes_qazo",
            hazar_manual_override_count=30,
        )
        apply_setup(setup)

        response_a = client_a.get("/api/qazo-records/")
        assert response_a.data["count"] == 0

        response_b = client_b.get("/api/qazo-records/")
        assert response_b.data["count"] == 1


class TestDailyLogListEndpoint:
    def test_user_cannot_see_another_users_logs(self, prayer_types, client_a, client_b, user_b):
        increment_daily_log(user_b, prayer_types["bomdod"], timezone.localdate(), "hazar_missed")
        response_a = client_a.get("/api/daily-logs/")
        assert response_a.data["count"] == 0
        response_b = client_b.get("/api/daily-logs/")
        assert response_b.data["count"] == 1


class TestDailyLogIncrementEndpoint:
    def test_increment_hazar_missed(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        response = client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "hazar_missed"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["hazar_missed_count"] == 1
        record = QazoRecord.objects.get(user=user_a, prayer_type__code="peshin")
        assert record.hazar_missed == 1

    def test_increment_qasr_missed(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        response = client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "qasr_missed"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["qasr_missed_count"] == 1
        record = QazoRecord.objects.get(user=user_a, prayer_type__code="peshin")
        assert record.qasr_missed == 1
        assert record.hazar_missed == 0

    def test_increment_completed(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "hazar_missed"},
            format="json",
        )
        response = client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "hazar_completed"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["hazar_completed_count"] == 1
        record = QazoRecord.objects.get(user=user_a, prayer_type__code="peshin")
        assert record.hazar_completed == 1

    def test_completed_does_not_exceed_that_buckets_missed(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        response = client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "hazar_completed"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["hazar_completed_count"] == 0
        record = QazoRecord.objects.get(user=user_a, prayer_type__code="peshin")
        assert record.hazar_completed == 0

    def test_rejects_invalid_field(self, prayer_types, client_a):
        today = timezone.localdate()
        response = client_a.post(
            "/api/daily-logs/increment/",
            {"prayer_type": "peshin", "date": today.isoformat(), "field": "bogus"},
            format="json",
        )
        assert response.status_code == 400


class TestRemainingTrendEndpoint:
    def test_reconstructs_remaining_backward_from_the_live_total(self, prayer_types, client_a, user_a):
        today = timezone.localdate()
        two_days_ago = today - timedelta(days=2)

        for _ in range(100):
            increment_daily_log(user_a, prayer_types["bomdod"], two_days_ago, "hazar_missed")
        for _ in range(10):
            increment_daily_log(user_a, prayer_types["bomdod"], today, "hazar_completed")

        response = client_a.get("/api/stats/remaining-trend/?period=day&prayer_type=all")
        assert response.status_code == 200
        # response.data holds raw Python objects (dates), not yet JSON-rendered
        points = {row["bucket"]: row["remaining"] for row in response.data}
        assert points[two_days_ago] == 100
        assert points[today] == 90

    def test_gap_days_are_carried_forward_not_skipped(self, prayer_types, client_a, user_a):
        # No activity on the day in between two_days_ago and today — the series
        # must still include it, flat at the same value, not jump straight over it.
        today = timezone.localdate()
        two_days_ago = today - timedelta(days=2)
        yesterday = today - timedelta(days=1)

        for _ in range(100):
            increment_daily_log(user_a, prayer_types["bomdod"], two_days_ago, "hazar_missed")
        for _ in range(10):
            increment_daily_log(user_a, prayer_types["bomdod"], today, "hazar_completed")

        response = client_a.get("/api/stats/remaining-trend/?period=day&prayer_type=all")
        buckets = [row["bucket"] for row in response.data]
        points = {row["bucket"]: row["remaining"] for row in response.data}
        assert yesterday in buckets  # not silently dropped
        assert points[yesterday] == 100  # carried forward from two_days_ago, unchanged

    def test_day_window_is_a_fixed_last_14_days_regardless_of_older_history(
        self, prayer_types, client_a, user_a
    ):
        today = timezone.localdate()
        long_ago = today - timedelta(days=150)
        increment_daily_log(user_a, prayer_types["bomdod"], long_ago, "hazar_missed")
        increment_daily_log(user_a, prayer_types["bomdod"], today, "hazar_missed")

        response = client_a.get("/api/stats/remaining-trend/?period=day&prayer_type=all")
        assert len(response.data) == 14
        assert response.data[0]["bucket"] == today - timedelta(days=13)
        assert response.data[-1]["bucket"] == today
        # The 150-day-old activity is baked into the live total (2 missed) but
        # its bucket falls outside the window, so the window starts flat at
        # what's left *before* today's +1 and only steps up on today's bucket.
        assert response.data[0]["remaining"] == 1
        assert response.data[-1]["remaining"] == 2

    def test_week_window_is_the_last_7_days(self, prayer_types, client_a):
        response = client_a.get("/api/stats/remaining-trend/?period=week&prayer_type=all")
        today = timezone.localdate()
        assert len(response.data) == 7
        assert response.data[0]["bucket"] == today - timedelta(days=6)
        assert response.data[-1]["bucket"] == today

    def test_month_window_is_the_last_30_days(self, prayer_types, client_a):
        response = client_a.get("/api/stats/remaining-trend/?period=month&prayer_type=all")
        today = timezone.localdate()
        assert len(response.data) == 30
        assert response.data[0]["bucket"] == today - timedelta(days=29)
        assert response.data[-1]["bucket"] == today

    def test_year_window_is_weekly_buckets_over_the_last_year(self, prayer_types, client_a):
        response = client_a.get("/api/stats/remaining-trend/?period=year&prayer_type=all")
        # 365 days of weekly buckets is ~52-53 points depending on where
        # "today" falls in its week — never the sparse single-year bucket the
        # old TruncYear grouping produced.
        assert 52 <= len(response.data) <= 53

    def test_rejects_bad_period(self, prayer_types, client_a):
        response = client_a.get("/api/stats/remaining-trend/?period=bogus")
        assert response.status_code == 400


class TestMenstruationPeriodPrivacy:
    def test_male_user_cannot_create_menstruation_period(self, client_a):
        response = client_a.post(
            "/api/profile/menstruation-periods/",
            {"start_date": "2026-07-01", "end_date": None},
            format="json",
        )
        assert response.status_code == 400

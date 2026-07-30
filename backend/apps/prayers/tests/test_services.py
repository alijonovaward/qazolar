from datetime import date, timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.prayers.models import DailyLog, InitialQazoSetup, PrayerType, QazoRecord
from apps.prayers.services.daily_log import increment_daily_log
from apps.prayers.services.forecast import (
    current_streak,
    daily_rakat_rate,
    forecast_days_remaining,
    remaining_rakats,
)
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
def user_female():
    return User.objects.create(email="female@test.com", gender=User.Gender.FEMALE)


@pytest.fixture
def user_male():
    return User.objects.create(email="male@test.com", gender=User.Gender.MALE)


class TestComputeInitialMissedCount:
    def test_consistent_status_is_zero(self, prayer_types, user_male):
        setup = InitialQazoSetup.objects.create(
            user=user_male,
            prayer_type=prayer_types["bomdod"],
            status=InitialQazoSetup.Status.CONSISTENT,
        )
        record = apply_setup(setup)
        assert record.total_missed == 0

    def test_manual_override_count_is_used(self, prayer_types, user_male):
        setup = InitialQazoSetup.objects.create(
            user=user_male,
            prayer_type=prayer_types["asr"],
            status=InitialQazoSetup.Status.OWES_QAZO,
            manual_override_count=50,
        )
        record = apply_setup(setup)
        assert record.total_missed == 50
        assert record.hazar_missed == 50  # setup never asks about travel — always hazar

    def test_owes_qazo_without_manual_count_starts_at_zero(self, prayer_types, user_male):
        # Most people don't know an exact number either — start fresh at 0 and
        # let the dashboard's "+" button track misses from here on.
        setup = InitialQazoSetup.objects.create(
            user=user_male,
            prayer_type=prayer_types["asr"],
            status=InitialQazoSetup.Status.OWES_QAZO,
        )
        record = apply_setup(setup)
        assert record.total_missed == 0

    def test_reapplying_setup_never_touches_total_completed(self, prayer_types, user_male):
        setup = InitialQazoSetup.objects.create(
            user=user_male,
            prayer_type=prayer_types["peshin"],
            status=InitialQazoSetup.Status.OWES_QAZO,
            manual_override_count=30,
        )
        apply_setup(setup)
        for _ in range(5):
            increment_daily_log(user_male, prayer_types["peshin"], date(2026, 7, 29), "hazar_completed")
        apply_setup(setup)  # re-run setup
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["peshin"])
        assert record.total_completed == 5

    def test_reapplying_setup_preserves_logged_misses(self, prayer_types, user_male):
        # Editing setup later must not wipe out misses logged via the "+" button
        # in the meantime — apply_setup used to overwrite total_missed outright.
        setup = InitialQazoSetup.objects.create(
            user=user_male,
            prayer_type=prayer_types["peshin"],
            status=InitialQazoSetup.Status.OWES_QAZO,
            manual_override_count=30,
        )
        apply_setup(setup)
        increment_daily_log(user_male, prayer_types["peshin"], date(2026, 7, 29), "hazar_missed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["peshin"])
        assert record.total_missed == 31  # 30 base + 1 logged miss

        apply_setup(setup)  # re-run setup again
        record.refresh_from_db()
        assert record.total_missed == 31  # still there, not reset to 30


class TestIncrementDailyLog:
    """The dashboard's tap-to-record +/- buttons, per bucket:
    'hazar_missed'/'qasr_missed' = 'I missed this prayer today' (adds to that
    bucket's debt); 'hazar_completed'/'qasr_completed' = 'I prayed one qazo'
    (pays that same bucket down). Hazar and qasr never mix — a prayer missed
    while travelling still owes a qasr qada once the trip is over."""

    def test_increment_hazar_missed_adds_to_hazar_missed(self, prayer_types, user_male):
        today = timezone.localdate()
        log = increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_missed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert log.hazar_missed_count == 1
        assert record.hazar_missed == 1

    def test_increment_qasr_missed_adds_to_qasr_missed(self, prayer_types, user_male):
        today = timezone.localdate()
        log = increment_daily_log(user_male, prayer_types["bomdod"], today, "qasr_missed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert log.qasr_missed_count == 1
        assert record.qasr_missed == 1
        assert record.hazar_missed == 0  # buckets never bleed into each other

    def test_increment_completed_adds_to_completed(self, prayer_types, user_male):
        today = timezone.localdate()
        increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_missed")
        log = increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_completed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert log.hazar_completed_count == 1
        assert record.hazar_completed == 1

    def test_completed_is_a_no_op_once_that_buckets_debt_reaches_zero(self, prayer_types, user_male):
        today = timezone.localdate()
        log = increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_completed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert log.hazar_completed_count == 0
        assert record.hazar_completed == 0

    def test_qasr_completed_cannot_pay_down_hazar_debt(self, prayer_types, user_male):
        # Owing 1 hazar qazo — tapping the *qasr* "-" must not touch it.
        today = timezone.localdate()
        increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_missed")
        increment_daily_log(user_male, prayer_types["bomdod"], today, "qasr_completed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert record.hazar_missed == 1
        assert record.hazar_completed == 0
        assert record.qasr_completed == 0

    def test_completed_stops_once_it_catches_up_to_that_buckets_missed(self, prayer_types, user_male):
        today = timezone.localdate()
        increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_missed")
        increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_completed")
        increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_completed")  # extra tap
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["bomdod"])
        assert record.hazar_missed == 1
        assert record.hazar_completed == 1  # capped, not 2
        assert record.remaining_count == 0

    def test_hazar_and_qasr_debts_are_independent_for_the_same_prayer(self, prayer_types, user_male):
        # 200 oddiy + 20 safar Peshin qazosi — a real user's scenario.
        today = timezone.localdate()
        for _ in range(200):
            increment_daily_log(user_male, prayer_types["peshin"], today, "hazar_missed")
        for _ in range(20):
            increment_daily_log(user_male, prayer_types["peshin"], today, "qasr_missed")
        for _ in range(5):
            increment_daily_log(user_male, prayer_types["peshin"], today, "qasr_completed")

        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["peshin"])
        assert record.hazar_missed == 200
        assert record.hazar_completed == 0  # untouched by the qasr taps
        assert record.qasr_missed == 20
        assert record.qasr_completed == 5
        assert record.remaining_hazar == 200
        assert record.remaining_qasr == 15

    def test_repeated_taps_accumulate_on_the_same_day(self, prayer_types, user_male):
        today = timezone.localdate()
        for _ in range(3):
            increment_daily_log(user_male, prayer_types["peshin"], today, "hazar_missed")
        for _ in range(2):
            increment_daily_log(user_male, prayer_types["peshin"], today, "hazar_completed")
        record = QazoRecord.objects.get(user=user_male, prayer_type=prayer_types["peshin"])
        assert record.hazar_missed == 3
        assert record.hazar_completed == 2
        assert DailyLog.objects.filter(user=user_male, prayer_type=prayer_types["peshin"]).count() == 1


class TestForecast:
    def test_rakats_for_selects_qasr_field_only_when_safar(self, prayer_types):
        peshin = prayer_types["peshin"]
        assert peshin.rakats_for(is_safar=False) == 4
        assert peshin.rakats_for(is_safar=True) == 2

    def test_bomdod_and_shom_unaffected_by_safar(self, prayer_types):
        assert prayer_types["bomdod"].rakats_for(is_safar=True) == 2
        assert prayer_types["shom"].rakats_for(is_safar=True) == 3

    def test_daily_rakat_rate_weights_by_rakat_not_prayer_count(self, prayer_types, user_male):
        # 2 hazar Bomdod completions (2 rakat each = 4) over a 1-day window ending today
        today = timezone.localdate()
        for _ in range(2):
            increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_missed")
        for _ in range(2):
            increment_daily_log(user_male, prayer_types["bomdod"], today, "hazar_completed")
        rate_bomdod = daily_rakat_rate(user_male, window_days=1)
        assert rate_bomdod == 4.0

    def test_qasr_completions_are_valued_at_the_shortened_rakat_count(self, prayer_types, user_male, user_female):
        today = timezone.localdate()
        for _ in range(2):
            increment_daily_log(user_male, prayer_types["peshin"], today, "hazar_missed")
            increment_daily_log(user_male, prayer_types["peshin"], today, "hazar_completed")
        for _ in range(2):
            increment_daily_log(user_female, prayer_types["peshin"], today, "qasr_missed")
            increment_daily_log(user_female, prayer_types["peshin"], today, "qasr_completed")
        assert daily_rakat_rate(user_male, window_days=1) == 8.0  # 2 * 4 rakat
        assert daily_rakat_rate(user_female, window_days=1) == 4.0  # 2 * 2 rakat

    def test_worked_example_matches_hand_calculation(self, prayer_types, user_male):
        # Anchored on the real "today" (daily_rakat_rate/forecast_days_remaining read
        # timezone.localdate() internally).
        today = timezone.localdate()
        peshin, asr, shom, xufton = (
            prayer_types["peshin"],
            prayer_types["asr"],
            prayer_types["shom"],
            prayer_types["xufton"],
        )
        InitialQazoSetup.objects.create(
            user=user_male, prayer_type=prayer_types["bomdod"],
            status=InitialQazoSetup.Status.CONSISTENT,
        )
        InitialQazoSetup.objects.create(
            user=user_male, prayer_type=peshin,
            status=InitialQazoSetup.Status.OWES_QAZO, manual_override_count=30,
        )
        InitialQazoSetup.objects.create(
            user=user_male, prayer_type=asr,
            status=InitialQazoSetup.Status.OWES_QAZO, manual_override_count=50,
        )
        InitialQazoSetup.objects.create(
            user=user_male, prayer_type=shom,
            status=InitialQazoSetup.Status.OWES_QAZO, manual_override_count=90,
        )
        InitialQazoSetup.objects.create(
            user=user_male, prayer_type=xufton,
            status=InitialQazoSetup.Status.OWES_QAZO, manual_override_count=30,
        )
        for setup in InitialQazoSetup.objects.filter(user=user_male):
            apply_setup(setup)

        window_start = today - timedelta(days=29)  # matches daily_rakat_rate(window_days=30)

        # Peshin: 20 hazar completions (of the 30 owed)
        for i in range(20):
            increment_daily_log(user_male, peshin, window_start + timedelta(days=i), "hazar_completed")

        # Asr: 4 qasr misses logged then fully paid off, plus 6 hazar completions
        for i in range(4):
            increment_daily_log(user_male, asr, window_start + timedelta(days=i), "qasr_missed")
        for i in range(4):
            increment_daily_log(user_male, asr, window_start + timedelta(days=i), "qasr_completed")
        for i in range(4, 10):
            increment_daily_log(user_male, asr, window_start + timedelta(days=i), "hazar_completed")

        # Xufton: 15 qasr misses logged then fully paid off
        for i in range(15):
            increment_daily_log(user_male, xufton, window_start + timedelta(days=i), "qasr_missed")
        for i in range(15):
            increment_daily_log(user_male, xufton, window_start + timedelta(days=i), "qasr_completed")

        # Shom: 5 hazar completions
        for i in range(5):
            increment_daily_log(user_male, shom, window_start + timedelta(days=i), "hazar_completed")

        rate = daily_rakat_rate(user_male, window_days=30)
        # peshin 20*4=80, asr 4*2+6*4=32, xufton 15*2=30, shom 5*3=15 -> 157
        assert rate == pytest.approx(157 / 30, rel=1e-6)

        remaining = remaining_rakats(user_male)
        # peshin hazar (30-20)*4=40
        # asr hazar (50-6)*4=176, qasr (4-4)*2=0
        # xufton hazar 30*4=120, qasr (15-15)*2=0
        # shom hazar (90-5)*3=255
        assert remaining == 40 + 176 + 120 + 255

        days_remaining = forecast_days_remaining(user_male, window_days=30)
        assert days_remaining == pytest.approx(remaining / rate, rel=1e-6)

    def test_forecast_is_none_when_no_activity(self, prayer_types, user_male):
        assert forecast_days_remaining(user_male) is None


class TestStreak:
    def test_streak_counts_consecutive_days_from_today(self, prayer_types, user_male):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        for day in (today, yesterday):
            increment_daily_log(user_male, prayer_types["bomdod"], day, "hazar_missed")
            increment_daily_log(user_male, prayer_types["bomdod"], day, "hazar_completed")
        assert current_streak(user_male) == 2

    def test_streak_is_zero_without_todays_log(self, prayer_types, user_male):
        yesterday = timezone.localdate() - timedelta(days=1)
        increment_daily_log(user_male, prayer_types["bomdod"], yesterday, "hazar_missed")
        increment_daily_log(user_male, prayer_types["bomdod"], yesterday, "hazar_completed")
        assert current_streak(user_male) == 0

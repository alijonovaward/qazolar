from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import OTPCode, User
from apps.accounts.otp import OTPVerificationError, create_otp, verify_otp

pytestmark = pytest.mark.django_db


class TestOtpService:
    def test_create_otp_stores_only_a_hash(self):
        code = create_otp("user@test.com")
        otp = OTPCode.objects.get(email="user@test.com")
        assert otp.code_hash != code
        assert len(code) == 6

    def test_verify_otp_succeeds_with_correct_code(self):
        code = create_otp("user@test.com")
        verify_otp("user@test.com", code)  # should not raise
        assert OTPCode.objects.get(email="user@test.com").is_used is True

    def test_verify_otp_fails_with_wrong_code(self):
        create_otp("user@test.com")
        with pytest.raises(OTPVerificationError):
            verify_otp("user@test.com", "000000")

    def test_requesting_a_new_code_invalidates_the_previous_one(self):
        first_code = create_otp("user@test.com")
        create_otp("user@test.com")
        with pytest.raises(OTPVerificationError):
            verify_otp("user@test.com", first_code)

    def test_verify_otp_fails_after_max_attempts(self, settings):
        settings.OTP_MAX_ATTEMPTS = 2
        create_otp("user@test.com")
        for _ in range(2):
            with pytest.raises(OTPVerificationError):
                verify_otp("user@test.com", "000000")
        # even the (now unreachable) correct code should fail: code is exhausted
        with pytest.raises(OTPVerificationError):
            verify_otp("user@test.com", "000000")


class TestRegisterEndpoint:
    def test_register_creates_user_and_sets_cookies(self):
        client = APIClient()
        response = client.post(
            "/api/auth/register/",
            {"email": "new@test.com", "password": "a-strong-pw-93", "password_confirm": "a-strong-pw-93"},
            format="json",
        )
        assert response.status_code == 201
        assert User.objects.filter(email="new@test.com").exists()
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    def test_register_rejects_mismatched_passwords(self):
        client = APIClient()
        response = client.post(
            "/api/auth/register/",
            {"email": "new@test.com", "password": "a-strong-pw-93", "password_confirm": "different-pw-1"},
            format="json",
        )
        assert response.status_code == 400

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email="dup@test.com", password="a-strong-pw-93")
        client = APIClient()
        response = client.post(
            "/api/auth/register/",
            {"email": "dup@test.com", "password": "a-strong-pw-93", "password_confirm": "a-strong-pw-93"},
            format="json",
        )
        assert response.status_code == 400


class TestLoginEndpoint:
    def test_login_with_correct_credentials_sets_cookies(self):
        User.objects.create_user(email="user@test.com", password="a-strong-pw-93")
        client = APIClient()
        response = client.post(
            "/api/auth/login/", {"email": "user@test.com", "password": "a-strong-pw-93"}, format="json"
        )
        assert response.status_code == 200
        assert "access_token" in response.cookies

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(email="user@test.com", password="a-strong-pw-93")
        client = APIClient()
        response = client.post(
            "/api/auth/login/", {"email": "user@test.com", "password": "wrong-password"}, format="json"
        )
        assert response.status_code == 400
        assert "access_token" not in response.cookies

    def test_profile_endpoint_requires_cookie(self):
        response = APIClient().get("/api/profile/me/")
        assert response.status_code == 401

    def test_logout_clears_session(self):
        User.objects.create_user(email="user@test.com", password="a-strong-pw-93")
        client = APIClient()
        client.post("/api/auth/login/", {"email": "user@test.com", "password": "a-strong-pw-93"}, format="json")

        assert client.get("/api/profile/me/").status_code == 200
        client.post("/api/auth/logout/")
        assert client.get("/api/profile/me/").status_code == 401


class TestUsernameField:
    def _client(self, email="user@test.com"):
        user = User.objects.create_user(email=email, password="a-strong-pw-93")
        client = APIClient()
        client.post("/api/auth/login/", {"email": email, "password": "a-strong-pw-93"}, format="json")
        return client, user

    def test_can_set_a_valid_username(self):
        client, _ = self._client()
        response = client.patch("/api/profile/me/", {"username": "Azamjon_1"}, format="json")
        assert response.status_code == 200
        # stored/returned lowercase regardless of how it was typed
        assert response.data["username"] == "azamjon_1"

    def test_rejects_invalid_characters(self):
        client, _ = self._client()
        response = client.patch("/api/profile/me/", {"username": "has a space"}, format="json")
        assert response.status_code == 400

    def test_rejects_duplicate_username_case_insensitively(self):
        User.objects.create_user(email="taken@test.com", username="azamjon", password="a-strong-pw-93")
        client, _ = self._client()
        response = client.patch("/api/profile/me/", {"username": "AZAMJON"}, format="json")
        assert response.status_code == 400

    def test_can_clear_username_back_to_null(self):
        client, user = self._client()
        client.patch("/api/profile/me/", {"username": "azamjon"}, format="json")
        response = client.patch("/api/profile/me/", {"username": ""}, format="json")
        assert response.status_code == 200
        user.refresh_from_db()
        assert user.username is None

    def test_two_users_can_both_have_no_username(self):
        client_a, _ = self._client("a@test.com")
        client_b, _ = self._client("b@test.com")
        assert client_a.get("/api/profile/me/").data["username"] is None
        assert client_b.get("/api/profile/me/").data["username"] is None


@patch("apps.accounts.views.send_otp_email.delay")
class TestPasswordReset:
    def test_reset_flow_changes_password(self, mock_send):
        User.objects.create_user(email="user@test.com", password="old-password-1")
        client = APIClient()

        client.post("/api/auth/password-reset/request/", {"email": "user@test.com"}, format="json")
        code = mock_send.call_args.args[1]

        response = client.post(
            "/api/auth/password-reset/confirm/",
            {"email": "user@test.com", "code": code, "new_password": "brand-new-pw-2"},
            format="json",
        )
        assert response.status_code == 200

        login = client.post(
            "/api/auth/login/", {"email": "user@test.com", "password": "brand-new-pw-2"}, format="json"
        )
        assert login.status_code == 200

        old_login = client.post(
            "/api/auth/login/", {"email": "user@test.com", "password": "old-password-1"}, format="json"
        )
        assert old_login.status_code == 400

    def test_request_does_not_leak_whether_email_exists(self, mock_send):
        client = APIClient()
        registered = client.post(
            "/api/auth/password-reset/request/", {"email": "unregistered@test.com"}, format="json"
        )
        assert registered.status_code == 200
        mock_send.assert_not_called()

    def test_third_request_within_a_minute_is_throttled(self, mock_send):
        User.objects.create_user(email="spam@test.com", password="a-strong-pw-93")
        client = APIClient()
        for _ in range(3):
            response = client.post(
                "/api/auth/password-reset/request/", {"email": "spam@test.com"}, format="json"
            )
            assert response.status_code == 200
        response = client.post(
            "/api/auth/password-reset/request/", {"email": "spam@test.com"}, format="json"
        )
        assert response.status_code == 429

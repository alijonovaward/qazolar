import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .models import OTPCode


class OTPVerificationError(Exception):
    pass


def _generate_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(settings.OTP_CODE_LENGTH))


def create_otp(email: str) -> str:
    """Invalidate any pending codes for this email and issue a fresh one. Returns the plaintext code (caller emails it; only the hash is persisted)."""
    OTPCode.objects.filter(email=email, is_used=False).update(is_used=True)
    code = _generate_code()
    OTPCode.objects.create(
        email=email,
        code_hash=make_password(code),
        expires_at=timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
    )
    return code


def verify_otp(email: str, code: str) -> None:
    """Raises OTPVerificationError on any failure; marks the code used on success."""
    otp = OTPCode.objects.filter(email=email, is_used=False).order_by("-created_at").first()
    if otp is None:
        raise OTPVerificationError("Kod topilmadi, qaytadan so'rang")
    if otp.expires_at < timezone.now():
        raise OTPVerificationError("Kod muddati tugagan, qaytadan so'rang")
    if otp.attempt_count >= settings.OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        raise OTPVerificationError("Urinishlar soni tugadi, qaytadan so'rang")
    if not check_password(code, otp.code_hash):
        otp.attempt_count += 1
        otp.save(update_fields=["attempt_count"])
        raise OTPVerificationError("Kod noto'g'ri")
    otp.is_used = True
    otp.save(update_fields=["is_used"])

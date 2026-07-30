from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_otp_email(email: str, code: str) -> None:
    send_mail(
        subject="QazoNamoz — tasdiqlash kodi",
        message=(
            f"Sizning tasdiqlash kodingiz: {code}\n\n"
            f"Kod {settings.OTP_EXPIRY_MINUTES} daqiqa amal qiladi."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
    )

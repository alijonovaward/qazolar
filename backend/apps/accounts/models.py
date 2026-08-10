from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimeStampedModel

username_validator = RegexValidator(
    regex=r"^[a-zA-Z0-9_]{3,32}$",
    message="Username faqat lotin harflari, raqam va pastki chiziqdan iborat bo'lishi kerak (3-32 belgi).",
)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_unusable_password() if password is None else user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if password is None:
            raise ValueError("Superusers must have a password")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Gender(models.TextChoices):
        MALE = "male", "Erkak"
        FEMALE = "female", "Ayol"
        UNSPECIFIED = "unspecified", "Ko'rsatilmagan"

    class VisibilityLevel(models.TextChoices):
        FULL = "full", "To'liq"
        PERCENT_ONLY = "percent_only", "Faqat foiz"
        NONE = "none", "Hech narsa"

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    # Public handle for apps.social (follow-by-username) — chosen by the user,
    # not set at signup, so it's null until they pick one. Always stored
    # lowercase (see UserSerializer.validate_username) so uniqueness doesn't
    # depend on case.
    username = models.CharField(
        max_length=32, unique=True, null=True, blank=True, validators=[username_validator]
    )
    gender = models.CharField(
        max_length=20, choices=Gender.choices, default=Gender.UNSPECIFIED
    )
    birth_date = models.DateField(null=True, blank=True)
    # Applies to everyone who successfully follows this user (see apps.social) —
    # a single global choice per user, not per-follower.
    follower_visibility = models.CharField(
        max_length=20, choices=VisibilityLevel.choices, default=VisibilityLevel.PERCENT_ONLY
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class OTPCode(TimeStampedModel):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["email", "is_used"])]


class MenstruationPeriod(TimeStampedModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="menstruation_periods"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-start_date"]

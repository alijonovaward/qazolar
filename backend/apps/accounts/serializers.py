from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import MenstruationPeriod, User


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Parollar mos kelmadi."})
        validate_password(attrs["password"])
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "gender", "birth_date", "created_at"]
        read_only_fields = ["id", "email", "created_at"]


class MenstruationPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenstruationPeriod
        fields = ["id", "start_date", "end_date"]

    def validate(self, attrs):
        user = self.context["request"].user
        if user.gender != User.Gender.FEMALE:
            raise serializers.ValidationError(
                "Bu maydon faqat ayol foydalanuvchilar uchun."
            )
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas."
            )
        return attrs

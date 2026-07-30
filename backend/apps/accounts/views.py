from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import IsOwner

from .cookies import clear_auth_cookies, set_auth_cookies
from .models import MenstruationPeriod
from .otp import OTPVerificationError, create_otp, verify_otp
from .serializers import (
    LoginSerializer,
    MenstruationPeriodSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tasks import send_otp_email
from .throttles import LoginThrottle, PasswordResetThrottle

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Email yoki parol noto'g'ri"}, status=status.HTTP_400_BAD_REQUEST
            )
        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        set_auth_cookies(response, str(refresh.access_token), str(refresh))
        return response


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        if User.objects.filter(email__iexact=email).exists():
            code = create_otp(email)
            send_otp_email.delay(email, code)
        # Same response either way — don't leak whether the email is registered.
        return Response(
            {"detail": "Agar bu email ro'yxatdan o'tgan bo'lsa, kod yuborildi"},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]

        try:
            verify_otp(email, code)
        except OTPVerificationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "Foydalanuvchi topilmadi"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Parol yangilandi"}, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token topilmadi"}, status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            response = Response(
                {"detail": "Token yaroqsiz, qayta kiring"}, status=status.HTTP_401_UNAUTHORIZED
            )
            clear_auth_cookies(response)
            return response

        data = serializer.validated_data
        response = Response({"detail": "ok"}, status=status.HTTP_200_OK)
        set_auth_cookies(response, data["access"], data.get("refresh", refresh_token))
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response({"detail": "Chiqdingiz"}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class MenstruationPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = MenstruationPeriodSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return MenstruationPeriod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the JWT access token from an httpOnly cookie instead of the Authorization header.

    Falls back to the header if present, so DRF-standard tooling (e.g. the browsable
    API, curl with -H) keeps working during development.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        raw_token = None
        if header is not None:
            raw_token = self.get_raw_token(header)
        if raw_token is None:
            raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

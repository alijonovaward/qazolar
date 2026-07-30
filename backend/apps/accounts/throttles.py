from rest_framework.throttling import SimpleRateThrottle


class EmailKeyedThrottle(SimpleRateThrottle):
    """Rate-limits by target email rather than source IP — the thing worth
    protecting is the recipient's account/inbox, not a particular client."""

    def get_cache_key(self, request, view):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return None
        return self.cache_format % {"scope": self.scope, "ident": email}


class PasswordResetThrottle(EmailKeyedThrottle):
    scope = "password-reset"


class LoginThrottle(EmailKeyedThrottle):
    scope = "login"

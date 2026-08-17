from .base import *  # noqa: F401,F403

DEBUG = False

# Both nginx layers (the system one terminating TLS, and this app's own
# internal one) set X-Forwarded-Proto — without telling Django to trust it,
# every request looks like plain HTTP from inside the container, and
# SECURE_SSL_REDIRECT below would redirect every request forever (the client
# already used https://, Django can't tell and redirects again).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Required by Django 4+ for any HTTPS POST (the admin's session/CSRF-cookie
# login form, not the JWT API) — derived from ALLOWED_HOSTS so it's one
# setting to configure per environment, not two.
CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS if host]  # noqa: F405

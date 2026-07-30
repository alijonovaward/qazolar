from .base import *  # noqa: F401,F403

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Avoid a real Redis dependency for unit tests; throttle counters just need
# *a* shared cache backend, not Redis specifically.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

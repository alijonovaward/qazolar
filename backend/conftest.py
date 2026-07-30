import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_cache():
    """Throttle counters live in the cache, not the DB, so pytest-django's
    per-test transaction rollback doesn't reset them. Without this, an
    earlier test's throttle hits leak into the next test that reuses the
    same email/IP — clear it before every test instead."""
    cache.clear()
    yield

from datetime import date, timedelta

from apps.accounts.models import User
from apps.prayers.models import PrayerType
from apps.prayers.services.daily_log import increment_daily_log

User.objects.filter(email="trend-check@test.com").delete()
u = User.objects.create(email="trend-check@test.com")
bomdod = PrayerType.objects.get(code="bomdod")

today = date.today()
yesterday = today - timedelta(days=1)
two_days_ago = today - timedelta(days=2)

# two days ago: missed 100 (all at once, simulate big initial debt via taps)
for _ in range(100):
    increment_daily_log(u, bomdod, two_days_ago, "hazar_missed")
# yesterday: no change
# today: completed 10 -> remaining should go 100 -> 100 -> 90
for _ in range(10):
    increment_daily_log(u, bomdod, today, "hazar_completed")

from apps.prayers.models import QazoRecord
r = QazoRecord.objects.get(user=u, prayer_type=bomdod)
print("current remaining (expect 90):", r.remaining_count)

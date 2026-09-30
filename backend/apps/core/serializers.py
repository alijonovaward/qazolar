from apps.social.serializers import TopContributorSerializer

TOP_N = 10


class LeaderboardMixin:
    """For any 'collective counter' serializer with a leaderboard — Zikr,
    CollectiveHabit, and SharedHabit all expose the same participant_count /
    my_count / my_rank / top_contributors shape, differing only in which
    related manager holds the per-user contribution rows (each with exactly
    .user and .count). Set `member_related_name` on the subclass to that
    manager's attribute name (e.g. "user_counts" or "members").

    Ranking is competition-style: ties share a rank, and the next distinct
    count skips accordingly (three people tied for 1st means the next
    person is 4th, not 2nd) — this comes for free from counting how many
    people have a strictly greater count."""

    member_related_name: str

    def _members(self, obj):
        return getattr(obj, self.member_related_name)

    def get_participant_count(self, obj) -> int:
        return self._members(obj).filter(count__gt=0).count()

    def get_my_count(self, obj) -> int:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return 0
        member = self._members(obj).filter(user=request.user).first()
        return member.count if member else 0

    def get_my_rank(self, obj) -> int | None:
        # No rank to speak of if you haven't contributed — this isn't "last
        # place", it's "not on the board yet".
        my_count = self.get_my_count(obj)
        if not my_count:
            return None
        ahead = self._members(obj).filter(count__gt=my_count).count()
        return ahead + 1

    def get_top_contributors(self, obj) -> list[dict]:
        top = self._members(obj).filter(count__gt=0).select_related("user").order_by("-count")[:TOP_N]
        return TopContributorSerializer(top, many=True).data

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
    people have a strictly greater count.

    Every method here reads from _all_members(obj) rather than issuing its
    own filtered query, so the four fields (participant_count, my_count,
    my_rank, top_contributors) share one dataset per object instead of each
    hitting the DB separately. For a *list* view, pair this with a
    Prefetch(member_related_name, ..., to_attr="prefetched_members") on the
    queryset (see ZikrListView / CollectiveHabitListView /
    SharedHabitListCreateView) — that turns "N objects → ~4N queries" into
    "N objects → 2 queries total". Single-object responses (e.g. the *Sync
    views, which re-serialize one object after a mutation) don't bother
    prefetching — _all_members falls back to a plain query, which is fine
    since there's only one object to serialize."""

    member_related_name: str
    prefetch_attr = "prefetched_members"

    def _all_members(self, obj) -> list:
        prefetched = getattr(obj, self.prefetch_attr, None)
        if prefetched is not None:
            return prefetched
        return list(getattr(obj, self.member_related_name).select_related("user").all())

    def _active_members(self, obj) -> list:
        return [m for m in self._all_members(obj) if m.count > 0]

    def get_participant_count(self, obj) -> int:
        return len(self._active_members(obj))

    def _my_member(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None
        # Cached per object (keyed by pk) on the serializer instance, since
        # DRF reuses the same child serializer across a many=True list and
        # calls my_count/my_rank as two independent SerializerMethodFields —
        # without this they'd each redo the same lookup.
        cache = self.__dict__.setdefault("_my_member_cache", {})
        if obj.pk not in cache:
            cache[obj.pk] = next(
                (m for m in self._all_members(obj) if m.user_id == request.user.id), None
            )
        return cache[obj.pk]

    def get_my_count(self, obj) -> int:
        member = self._my_member(obj)
        return member.count if member else 0

    def get_my_rank(self, obj) -> int | None:
        # No rank to speak of if you haven't contributed — this isn't "last
        # place", it's "not on the board yet".
        member = self._my_member(obj)
        if not member or not member.count:
            return None
        ahead = sum(1 for m in self._active_members(obj) if m.count > member.count)
        return ahead + 1

    def get_top_contributors(self, obj) -> list[dict]:
        top = sorted(self._active_members(obj), key=lambda m: -m.count)[:TOP_N]
        return TopContributorSerializer(top, many=True).data

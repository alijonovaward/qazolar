from django.contrib import admin

from .models import FollowRelation


@admin.register(FollowRelation)
class FollowRelationAdmin(admin.ModelAdmin):
    list_display = ["follower", "followee", "status", "created_at"]
    list_filter = ["status"]

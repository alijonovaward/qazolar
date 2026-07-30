from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: request.user must be the `user` field of the object."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id

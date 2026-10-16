from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnlyPublic(BasePermission):
    """
    Allows authenticated users to access their own songs and view other users' public songs.

    Only the song's owner can modify or delete it.
    """

    def has_object_permission(self, request, view, obj):
        # Allow owners to perform any operation
        if obj.owner == request.user:
            return True

        # Allow read-only access to public songs
        if request.method in SAFE_METHODS and obj.is_public:
            return True

        # Deny all other operations
        return False

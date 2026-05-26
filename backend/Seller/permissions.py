from rest_framework.permissions import BasePermission


class IsBusinessSeller(BasePermission):
    message = "Only authenticated business sellers can access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and str(getattr(user, "account_type", "")).lower() == "business"
        )

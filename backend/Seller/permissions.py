from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

from Customer.models import Customer


class IsBusinessSeller(BasePermission):
    message = "Only authenticated business sellers can access this resource."

    def has_permission(self, request, view):
        user = request.user
        is_business_seller = bool(
            user
            and user.is_authenticated
            and str(getattr(user, "account_type", "")).lower() == "business"
        )
        if not is_business_seller:
            return False
        if getattr(user, "user_status", None) != Customer.STATUS_ACTIVE:
            raise PermissionDenied({"message": "Email verification required."})
        return True

from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from .models import Customer


class ActiveAccountRequired(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "user_status", None) != Customer.STATUS_ACTIVE:
            raise PermissionDenied({"message": "Email verification required."})
        return True


class EmailVerifiedRequired(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not getattr(user, "email_verified", False):
            raise PermissionDenied({"message": "Please verify your email before placing an order."})
        return True

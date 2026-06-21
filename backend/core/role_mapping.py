"""
Keycloak Role Mapping Strategy

Maps Keycloak realm roles to Django/permission semantics.

This module defines the role strategy only.
No runtime role switching is performed.
Active authentication is NOT modified.
"""


class RoleMapping:
    """
    Defines the mapping between Keycloak roles and application-level
    permissions, feature access, and user type semantics.

    This is a reference implementation for future activation.
    """

    # Keycloak realm roles
    CUSTOMER = "customer"
    SELLER = "seller"
    ADMIN = "admin"
    SUPPORT = "support"

    # Map Keycloak role → application account type
    ACCOUNT_TYPE_MAP = {
        CUSTOMER: "personal",
        SELLER: "business",
        ADMIN: "personal",
        SUPPORT: "personal",
    }

    # Map Keycloak role → allowed frontend sections
    FEATURE_ACCESS = {
        CUSTOMER: [
            "browse_products",
            "manage_cart",
            "checkout",
            "view_orders",
            "manage_wishlist",
            "view_profile",
            "manage_addresses",
            "view_bids",
            "compare_products",
        ],
        SELLER: [
            # All customer features +
            "seller_dashboard",
            "manage_products",
            "view_seller_orders",
            "manage_inventory",
            "view_sales_analytics",
            "manage_listings",
        ],
        ADMIN: [
            # All features +
            "admin_panel",
            "manage_users",
            "manage_roles",
            "system_config",
            "view_audit_logs",
            "manage_categories",
            "manage_banners",
        ],
        SUPPORT: [
            # Limited management +
            "view_users",
            "view_orders",
            "manage_tickets",
            "process_returns",
            "view_disputes",
        ],
    }

    # Role hierarchy (higher index = more privileges)
    ROLE_HIERARCHY = {
        CUSTOMER: 0,
        SELLER: 1,
        SUPPORT: 2,
        ADMIN: 3,
    }

    @classmethod
    def get_account_type(cls, roles):
        """Derive account type from Keycloak roles."""
        if cls.SELLER in roles:
            return "business"
        return "personal"

    @classmethod
    def get_features(cls, roles):
        """Get union of features for all assigned roles."""
        features = set()
        for role in roles:
            role_features = cls.FEATURE_ACCESS.get(role, [])
            features.update(role_features)
        return sorted(features)

    @classmethod
    def has_access(cls, roles, feature):
        """Check if a user with given roles can access a feature."""
        return feature in cls.get_features(roles)

    @classmethod
    def get_highest_role(cls, roles):
        """Return the highest-priority role from the list."""
        ranked = [(cls.ROLE_HIERARCHY.get(r, -1), r) for r in roles]
        ranked.sort(reverse=True)
        return ranked[0][1] if ranked else cls.CUSTOMER

    @classmethod
    def is_seller(cls, roles):
        return cls.SELLER in roles

    @classmethod
    def is_admin(cls, roles):
        return cls.ADMIN in roles

    @classmethod
    def is_support(cls, roles):
        return cls.SUPPORT in roles


# ==============================================================================
# Django REST Framework Permission Classes (for future activation)
# ==============================================================================

# Example permission classes that would be used when Keycloak is active:

class IsCustomer:
    """Allowed if user has 'customer' role in Keycloak."""
    def has_permission(self, request, view):
        roles = getattr(request.user, 'keycloak_roles', [])
        return RoleMapping.CUSTOMER in roles


class IsSeller:
    """Allowed if user has 'seller' role in Keycloak."""
    def has_permission(self, request, view):
        roles = getattr(request.user, 'keycloak_roles', [])
        return RoleMapping.SELLER in roles


class IsAdmin:
    """Allowed if user has 'admin' role in Keycloak."""
    def has_permission(self, request, view):
        roles = getattr(request.user, 'keycloak_roles', [])
        return RoleMapping.ADMIN in roles


class IsSupport:
    """Allowed if user has 'support' role in Keycloak."""
    def has_permission(self, request, view):
        roles = getattr(request.user, 'keycloak_roles', [])
        return RoleMapping.SUPPORT in roles


class HasFeatureAccess:
    """
    Check if user has access to a specific feature.
    Usage: HasFeatureAccess('manage_products')
    """
    def __init__(self, feature):
        self.feature = feature

    def has_permission(self, request, view):
        roles = getattr(request.user, 'keycloak_roles', [])
        return RoleMapping.has_access(roles, self.feature)

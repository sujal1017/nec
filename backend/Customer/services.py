import logging
import secrets

from django.utils import timezone

from .keycloak import (
    assign_keycloak_role,
    create_keycloak_user,
    find_keycloak_user_by_email,
    get_keycloak_user_status,
)
from .models import Customer

logger = logging.getLogger(__name__)


def keycloak_role_for_customer(user):
    return "seller" if getattr(user, "account_type", "personal") == "business" else "customer"


def mark_user_email_verified_from_keycloak(user):
    update_fields = []
    if not user.is_verified:
        user.is_verified = True
        update_fields.append("is_verified")
    if not user.email_verified:
        user.email_verified = True
        update_fields.append("email_verified")
    if user.verification_timestamp is None:
        user.verification_timestamp = timezone.now()
        update_fields.append("verification_timestamp")
    if user.user_status == Customer.STATUS_PENDING_VERIFICATION:
        user.user_status = Customer.STATUS_ACTIVE
        update_fields.append("user_status")
    if update_fields:
        user.save(update_fields=update_fields)
        logger.info("EMAIL_VERIFIED user_id=%s email=%s", user.id, user.email)
        logger.info("EMAIL_VERIFICATION_SYNCED user_id=%s email=%s", user.id, user.email)
        logger.info("ACCOUNT_ACTIVATED user_id=%s email=%s", user.id, user.email)


def ensure_keycloak_account_for_user(user, password=None):
    if user.keycloak_user_id:
        status_data = get_keycloak_user_status(user.keycloak_user_id)
        if status_data is not None:
            return user.keycloak_user_id
        logger.warning(
            "Stored Keycloak user ID could not be found; attempting email lookup user_id=%s keycloak_user_id=%s",
            user.id,
            user.keycloak_user_id,
        )

    keycloak_user_id = find_keycloak_user_by_email(user.email)
    if keycloak_user_id:
        logger.info("Backfilled Keycloak user ID from email lookup user_id=%s keycloak_user_id=%s", user.id, keycloak_user_id)
        user.keycloak_user_id = keycloak_user_id
        user.save(update_fields=["keycloak_user_id"])
    else:
        logger.info("Creating missing Keycloak account for existing user user_id=%s email=%s", user.id, user.email)
        keycloak_user_id = create_keycloak_user(
            username=user.username or user.email,
            email=user.email,
            first_name=user.first_name or "",
            last_name=user.last_name or "",
            password=password or secrets.token_urlsafe(32),
            account_type=keycloak_role_for_customer(user),
            business_name=getattr(user, "business_name", ""),
        )
        user.keycloak_user_id = keycloak_user_id
        user.save(update_fields=["keycloak_user_id"])

    assign_keycloak_role(keycloak_user_id, keycloak_role_for_customer(user))
    return keycloak_user_id


def sync_keycloak_verification(user):
    try:
        keycloak_user_id = ensure_keycloak_account_for_user(user)
        status_data = get_keycloak_user_status(keycloak_user_id)
        if not status_data:
            logger.warning("Keycloak verification status unavailable user_id=%s keycloak_user_id=%s", user.id, keycloak_user_id)
            return False

        email_verified = bool(status_data.get("emailVerified"))
        logger.info(
            "Keycloak verification status user_id=%s keycloak_user_id=%s emailVerified=%s",
            user.id,
            keycloak_user_id,
            email_verified,
        )
        if email_verified:
            if not user.is_verified or not user.email_verified or user.verification_timestamp is None:
                mark_user_email_verified_from_keycloak(user)
            return True

        if user.user_status in (Customer.STATUS_SUSPENDED, Customer.STATUS_DELETED):
            return False
        if user.email_verified:
            update_fields = []
            if not user.is_verified:
                user.is_verified = True
                update_fields.append("is_verified")
            if user.verification_timestamp is None:
                user.verification_timestamp = timezone.now()
                update_fields.append("verification_timestamp")
            if user.user_status == Customer.STATUS_PENDING_VERIFICATION:
                user.user_status = Customer.STATUS_ACTIVE
                update_fields.append("user_status")
            if update_fields:
                user.save(update_fields=update_fields)
            return True

        if user.is_verified or user.user_status != Customer.STATUS_PENDING_VERIFICATION:
            user.is_verified = False
            user.user_status = Customer.STATUS_PENDING_VERIFICATION
            user.save(update_fields=["is_verified", "user_status"])
        return False
    except Exception:
        logger.exception("Keycloak verification sync failed user_id=%s", getattr(user, "id", None))
        return False


def auth_verification_payload(user):
    email_verified = bool(getattr(user, "email_verified", False) or getattr(user, "is_verified", False))
    user_status = getattr(user, "user_status", Customer.STATUS_PENDING_VERIFICATION)
    return {
        "emailVerified": email_verified,
        "verified": email_verified,
        "requiresEmailVerification": not email_verified,
        "requiresVerification": not email_verified,
        "userStatus": user_status,
    }

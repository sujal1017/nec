"""
Keycloak OIDC Authentication Backend

Validates Keycloak JWTs using RS256 signatures.
Caches JWKS keys for performance.

This module is infrastructure-only.
Current SimpleJWT authentication remains active.
"""
from jose import jwt, jwk
from jose.utils import base64url_encode, base64url_decode
import requests
import time
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


class JWKSCache:
    """
    Thread-safe JWKS key cache with TTL.
    Fetches from Keycloak's JWKS endpoint and caches for 1 hour.
    """
    _keys = None
    _fetched_at = 0
    _cache_ttl = 3600  # 1 hour

    @classmethod
    def get_jwks_url(cls):
        base = settings.KEYCLOAK_SERVER_URL.rstrip('/')
        realm = settings.KEYCLOAK_REALM
        return f"{base}/realms/{realm}/protocol/openid-connect/certs"

    @classmethod
    def get_keys(cls):
        now = time.time()
        if cls._keys is None or (now - cls._fetched_at) > cls._cache_ttl:
            cls.refresh()
        return cls._keys

    @classmethod
    def refresh(cls):
        try:
            url = cls.get_jwks_url()
            logger.info("Fetching JWKS from %s", url)
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            cls._keys = resp.json().get('keys', [])
            cls._fetched_at = time.time()
            logger.info("JWKS refreshed: %d keys loaded", len(cls._keys))
        except requests.RequestException as e:
            logger.warning("Failed to fetch JWKS: %s", e)
            if cls._keys is None:
                raise RuntimeError("No JWKS keys available and unable to fetch") from e

    @classmethod
    def clear(cls):
        cls._keys = None
        cls._fetched_at = 0
        logger.info("JWKS cache cleared")


def get_signing_key(key_id):
    """Find the signing key with matching kid."""
    keys = JWKSCache.get_keys()
    for k in keys:
        if k.get('kid') == key_id:
            return jwk.construct(k)
    raise ValueError(f"No signing key found for kid: {key_id}")


def validate_keycloak_token(token):
    """
    Validate a Keycloak JWT access token.
    
    Returns:
        dict: Decoded token payload if valid.
    
    Raises:
        ValueError: If token is invalid, expired, or signature verification fails.
    """
    try:
        # Get unverified header first to find the key
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        if not kid:
            raise ValueError("Token header missing 'kid'")

        # Get the signing key from JWKS
        signing_key = get_signing_key(kid)

        # Decode and verify
        payload = jwt.decode(
            token,
            signing_key.to_pem().decode('utf-8'),
            algorithms=['RS256'],
            audience=settings.OIDC_RP_CLIENT_ID,
            issuer=settings.OIDC_OP_ISSUER,
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_aud': True,
                'verify_iss': True,
            }
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTClaimsError as e:
        raise ValueError(f"Token claims invalid: {e}")
    except jwt.JOSEError as e:
        raise ValueError(f"Token validation failed: {e}")
    except Exception as e:
        raise ValueError(f"Token processing error: {e}")


def extract_role_from_token(payload):
    """
    Extract realm roles from validated token payload.
    
    Returns:
        list: List of role strings. Defaults to ['customer'] if no roles found.
    """
    realm_access = payload.get('realm_access', {})
    roles = realm_access.get('roles', [])
    return roles if roles else ['customer']


class KeycloakOIDCAuthentication:
    """
    DRF authentication backend for Keycloak-issued JWT tokens.
    
    Validates RS256-signed access tokens against the configured Keycloak realm.
    Extracts user identity and roles from the token payload.
    
    This authentication class is registered but NOT activated by default.
    SimpleJWT remains the active authentication mechanism.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]

        try:
            payload = validate_keycloak_token(token)
        except ValueError as e:
            logger.warning("Keycloak token validation failed: %s", e)
            return None

        sub = payload.get('sub')
        if not sub:
            logger.warning("Token missing 'sub' claim")
            return None

        email = payload.get('email', '')
        preferred_username = payload.get('preferred_username', sub)
        first_name = payload.get('given_name', '')
        last_name = payload.get('family_name', '')
        roles = extract_role_from_token(payload)

        # Sync user in local database
        user, created = User.objects.get_or_create(
            keycloak_sub=sub,
            defaults={
                'username': preferred_username,
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'name': f"{first_name} {last_name}".strip() or preferred_username,
                'keycloak_sub': sub,
                'account_type': self._derive_account_type(roles),
            }
        )

        if not created:
            # Update synced fields
            changed = False
            for attr, val in [
                ('keycloak_sub', sub),
                ('email', email),
                ('first_name', first_name),
                ('last_name', last_name),
                ('name', f"{first_name} {last_name}".strip() or preferred_username),
            ]:
                if getattr(user, attr, None) != val:
                    setattr(user, attr, val)
                    changed = True

            new_account_type = self._derive_account_type(roles)
            if user.account_type != new_account_type:
                user.account_type = new_account_type
                changed = True

            if changed:
                user.save()

        user.is_authenticated = True
        user.keycloak_roles = roles
        return (user, token)

    def authenticate_header(self, request):
        return f'Bearer realm="{settings.KEYCLOAK_REALM}"'

    @staticmethod
    def _derive_account_type(roles):
        return "business" if "seller" in roles else "personal"


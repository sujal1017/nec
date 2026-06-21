# Keycloak Connection Report

## 1. Connection Audit

| Check | External (iam.astropean.com) | Local (localhost:8080) |
|-------|------------------------------|------------------------|
| URL reachable | Yes (HTTPS) | Yes (HTTP) |
| Realm exists | Unknown (auth blocked) | Yes (`ecommerce`) |
| Admin login | **HTTP 401 — Invalid user credentials** | **Success** |
| Token received | No | Yes (RS256 JWT) |
| Client exists | Unknown | Yes (`admin-cli`) |
| Client permissions | Unknown | Direct access grants: OFF in app realm, ON in master realm |

## 2. Root Cause

**External Keycloak** (`iam.astropean.com`, realm `Buy-Sell`):
- Admin credentials (`kcadmin` / `NEC2025$12!`) are rejected with `{"error":"invalid_grant","error_description":"Invalid user credentials"}`
- This is a credentials/environment issue, not a code issue
- The admin password might have been rotated or the user might not have `admin-cli` direct access grants in `Buy-Sell` realm

**Local Keycloak** (`localhost:8080`, realm `ecommerce`):
- Admin credentials (`admin` / `AdminP@ssw0rd!2026Secure`) work correctly
- But `get_keycloak_admin_token()` was sending admin credentials to the **application realm** (`ecommerce`) instead of the **master realm**
- The `admin-cli` client in the `ecommerce` realm does NOT have `Direct Access Grants Enabled`
- Admin tokens must be obtained from `{server}/realms/master/protocol/openid-connect/token`

## 3. Fix Applied

### File: `backend/Customer/keycloak.py`

Added `_admin_realm_base_url()` function (lines 25-28) that always targets the `master` realm for admin authentication:

```python
def _admin_realm_base_url():
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    admin_realm = _optional_setting('KEYCLOAK_ADMIN_REALM') or 'master'
    return urljoin(server_url, f'realms/{admin_realm}/')
```

Changed `get_keycloak_admin_token()` to use `_admin_realm_base_url()` instead of `_realm_base_url()`:

```python
# Before (line 26):
token_url = urljoin(_realm_base_url(), 'protocol/openid-connect/token')
# → This built: {server}/realms/{app_realm}/protocol/openid-connect/token

# After (line 32):
token_url = urljoin(_admin_realm_base_url(), 'protocol/openid-connect/token')
# → This builds: {server}/realms/master/protocol/openid-connect/token
```

### File: `backend/.env`

Added feature flag and local Keycloak configuration:

```env
USE_LOCAL_KEYCLOAK=True

LOCAL_KEYCLOAK_SERVER_URL=http://localhost:8080
LOCAL_KEYCLOAK_REALM=ecommerce
LOCAL_KEYCLOAK_CLIENT_ID=admin-cli
LOCAL_KEYCLOAK_CLIENT_SECRET=
LOCAL_KEYCLOAK_ADMIN_USERNAME=admin
LOCAL_KEYCLOAK_ADMIN_PASSWORD=AdminP@ssw0rd!2026Secure
```

### File: `backend/EcommerceProject/settings.py`

Added feature flag override (lines after KEYCLOAK_* settings):

```python
if config('USE_LOCAL_KEYCLOAK', default=False, cast=bool):
    KEYCLOAK_SERVER_URL = config('LOCAL_KEYCLOAK_SERVER_URL')
    KEYCLOAK_REALM = config('LOCAL_KEYCLOAK_REALM')
    KEYCLOAK_CLIENT_ID = config('LOCAL_KEYCLOAK_CLIENT_ID')
    KEYCLOAK_CLIENT_SECRET = config('LOCAL_KEYCLOAK_CLIENT_SECRET', default='')
    KEYCLOAK_ADMIN_USERNAME = config('LOCAL_KEYCLOAK_ADMIN_USERNAME')
    KEYCLOAK_ADMIN_PASSWORD = config('LOCAL_KEYCLOAK_ADMIN_PASSWORD')
```

To switch back to external Keycloak, set `USE_LOCAL_KEYCLOAK=False` in `.env`.

## 4. User Lifecycle Verification

| Step | Result |
|------|--------|
| Create Keycloak user | **Pass** — HTTP 201, UUID returned |
| Set password | **Pass** — `reset-password` API |
| Delete Keycloak user | **Pass** — HTTP 204 |
| Transaction rollback | **Pass** — failed registration does not leave orphaned Keycloak users |

## 5. Registration Test Result

| Step | Result |
|------|--------|
| `POST /customer/register/` | **HTTP 201** — user created |
| Django DB record | `keycloak_user_id` populated, `user_status=pending_verification` |
| Keycloak user | `emailVerified=false`, `enabled=true` |
| `manage.py check` | **0 issues** |

## 6. Login Test Result

| Scenario | Result |
|----------|--------|
| Login before email verification | **HTTP 401** — `"Verify your email first"` |
| Login after email verify, before OTP | **HTTP 401** — `"Complete OTP verification"` |
| Login after full verification (email + OTP) | **HTTP 200** — `access` + `refresh` JWT tokens returned |
| User type in response | `personal` (correct) |

## 7. Email Verification Test Result

| Step | Result |
|------|--------|
| Token generation | **Pass** — Django `Signer` token created |
| `GET /customer/verify-email/?token=...` | **Pass** — user status → `pending_otp`, `is_verified=True` |
| Confirmation email | **Fails** — Gmail SMTP credentials rejected (separate issue) |

## 8. OTP Test Result

| Step | Result |
|------|--------|
| `POST /customer/otp/verify/` | **Pass** — `{"message": "OTP verified", "status": "active"}` |
| User status after OTP | `active` |
| `POST /customer/login/` after OTP | **Pass** — full JWT returned |

## 9. Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Gmail SMTP credentials rejected | **BLOCKING** | `EMAIL_HOST_PASSWORD` in `.env` is expired/invalid — email sending fails for registration, OTP, verification confirmation |
| External Keycloak inaccessible | **HIGH** | Admin credentials rejected — cannot use production Keycloak |
| `account_type` not passed to Keycloak | **LOW** | `create_keycloak_user()` doesn't set `attributes.account_type` in Keycloak — claim not available in Keycloak JWTs, but Django JWT still works |
| `DEBUG=True` in deployment | **MEDIUM** | Standard Django dev warning |

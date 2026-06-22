# Keycloak Email Verification Migration Report

## Status: COMPLETED

All 8 end-to-end tests pass. Frontend builds with 0 errors. Backend `manage.py check` reports 0 issues.

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Keycloak is source of truth for `emailVerified` | Eliminates dual-token logic; aligns with IAM ownership |
| Django `is_verified` is a read cache synced on every auth touch | Avoids stale state without polling; synced in login, OTP, and verification-status |
| `send-verify-email` uses `client_id=ecommerce-frontend` | Required by Keycloak Admin API; configurable via `KEYCLOAK_VERIFICATION_CLIENT_ID` |
| OTP flow preserved and independent | OTP generation, sending, verification unchanged; gate now checks Keycloak-backed `is_verified` |
| All email sends are non-fatal | `send_keycloak_verification_email` wrapped in try/except; registration succeeds even if SMTP/Keycloak fails |
| `admin-cli` client uses `master` realm | Direct access grants only available in `master` realm for Keycloak Admin API |
| MailHog in Docker compose | Local SMTP for dev; Keycloak SMTP configured for `mailhog:1025`; UI at `localhost:8025` |

## Files Changed

### Backend
- **`backend/Customer/keycloak.py`** — Added `get_keycloak_user_status()`, `assign_keycloak_role()`, `send_keycloak_verification_email()` (with `client_id` param); modified `create_keycloak_user()` to set `requiredActions: ["VERIFY_EMAIL"]`
- **`backend/Customer/views.py`** — Added `_sync_keycloak_verification()` helper, `VerificationStatus` view (replacing `EmailVerificationStatus`); gated login on Keycloak `emailVerified`; registration triggers Keycloak email + role assignment
- **`backend/Customer/urls.py`** — Removed `verify-email/status/`, `verify-email/` routes; added `verification-status/`
- **`backend/Customer/utils.py`** — **DELETED** (was Django token signer for self-managed email)
- **`backend/Customer/html_pages.py`** — **DELETED** (was HTML template for Django-hosted verify page)
- **`backend/Customer/serializers.py`** — `RegisterCustomerSerializer` maps `fullName→full_name`; `CustomerNamePhoneSerializer` includes `is_verified`, `user_status`
- **`backend/EcommerceProject/settings.py`** — Added `KEYCLOAK_VERIFICATION_CLIENT_ID` default; `USE_LOCAL_KEYCLOAK` feature flag
- **`docker-compose.keycloak.yml`** — Added MailHog service

### Frontend
- **`src/pages/auth/VerifyAccount.jsx`** — Calls `/customer/verification-status/`; handles new response schema
- **`src/pages/VerifyEmail.jsx`** — Redirects to `/verify-account` since Django verify-email endpoint removed

### Keycloak Config
- **`keycloak/realm-export.json`** — SMTP reconfigured for MailHog; `userProfile` block removed (KC 25.0 compat)

## Sequence Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│  Client  │         │  Django   │         │ Keycloak │         │ MailHog  │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
     │  POST /register    │                    │                    │
     │───────────────────>│                    │                    │
     │                    │ POST /admin/realms │                    │
     │                    │ /{realm}/users     │                    │
     │                    │───────────────────>│                    │
     │                    │ (requiredActions:  │                    │
     │                    │  ["VERIFY_EMAIL"]) │                    │
     │                    │<───────────────────│                    │
     │                    │                    │                    │
     │                    │ POST /admin/realms │                    │
     │                    │ /{realm}/users/    │                    │
     │                    │ {id}/send-verify-  │                    │
     │                    │ email?client_id=   │                    │
     │                    │ ecommerce-frontend │                    │
     │                    │───────────────────>│                    │
     │                    │                    │  SMTP email        │
     │                    │                    │───────────────────>│
     │                    │                    │                    │
     │  201 + user_id     │                    │                    │
     │<───────────────────│                    │                    │
     │                    │                    │                    │
     │User clicks verify  │                    │                    │
     │link in email       │                    │                    │
     │─────────────────────────────────────────>│                   │
     │                    │                    │                    │
     │  GET /verification-│                    │                    │
     │  status/?email=..  │                    │                    │
     │───────────────────>│                    │                    │
     │                    │ GET /admin/realms  │                    │
     │                    │ /{realm}/users/    │                    │
     │                    │ {id}               │                    │
     │                    │───────────────────>│                    │
     │                    │<───────────────────│                    │
     │                    │ (emailVerified:    │                    │
     │                    │  true/false)       │                    │
     │                    │                    │                    │
     │  {emailVerified,   │                    │                    │
     │   status, ...}     │                    │                    │
     │<───────────────────│                    │                    │
     │                    │                    │                    │
     │  POST /login       │                    │                    │
     │───────────────────>│                    │                    │
     │                    │ sync KC status     │                    │
     │                    │ check is_verified  │                    │
     │  JWT or 401        │                    │                    │
     │<───────────────────│                    │                    │
```

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| External Keycloak (iam.astropean.com) admin credentials rejected | **HIGH** | Blocking production testing; credentials needed from IAM team |
| Gmail SMTP credentials expired | **MEDIUM** | Email falls back to console backend; real email delivery blocked |
| Keycloak Admin API rate limits | **LOW** | Only called on registration + login + status check (non-polling) |
| Keycloak Admin API `send-verify-email` requires `client_id` param | **LOW** | Configured via env var; default `ecommerce-frontend` |
| `userProfile` field in realm-export (KC 25.0 incompat) | **LOW** | Already removed; re-appears if re-exported from KC 26+ |
| MailHog authentication (Keycloak 26+ requires auth) | **LOW** | Keycloak 25.0 allows no-auth SMTP; upgrade may need `mailhog_auth: enabled` |
| OTP flow still present (planned future removal) | **LOW** | Not blocking; can be removed in separate PR when ready |

## Remaining Work

- [ ] Wire OIDC validation (`oidc_auth.py`) into DRF authentication classes for full token-based flows
- [ ] Test against external Keycloak once admin credentials are available
- [ ] Fix Gmail SMTP credentials for real email delivery
- [ ] Update `RESEND_VERIFICATION_EMAIL.md` if it references deleted endpoints
- [ ] Remove OTP flow after email verification is fully production-validated

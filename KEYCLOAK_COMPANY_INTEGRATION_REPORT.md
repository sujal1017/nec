# Company Keycloak Integration Report

Date: 2026-06-22
Target Server: https://iam.astropean.com
Target Realm: Buy-Sell
Admin User: kcadmin

## Executive Summary

Status: IMPLEMENTED WITH EXTERNAL ADMIN-CREDENTIAL BLOCKER

The backend has been switched away from local Docker Keycloak and now points only to the company Keycloak configuration from `backend/.env`.

Local Docker Keycloak references, local realm exports, local compose files, local Docker secrets, and stale local-Keycloak reports were removed from the repository. Existing Django/JWT auth flows remain operational.

Public realm discovery for `https://iam.astropean.com/realms/Buy-Sell/.well-known/openid-configuration` returns HTTP 200.

Admin token acquisition against the master realm fails with HTTP 401:

```json
{"error":"invalid_grant","error_description":"Invalid user credentials"}
```

Because the Admin API token is rejected, user creation, role assignment, client redirect URI inspection, SMTP inspection, and execute-actions-email verification cannot be completed against the company realm until the `kcadmin` credentials or permissions are corrected.

## Configuration Audit

| Item | Result |
|---|---|
| Backend Keycloak server | `https://iam.astropean.com` |
| Backend Keycloak realm | `Buy-Sell` |
| Backend Keycloak admin client | `admin-cli` |
| Backend Keycloak admin username | `kcadmin` |
| Admin token realm | `master` |
| Local override flag | Removed |
| Local Docker Keycloak compose | Removed |
| Local realm export | Removed |
| Local Docker secrets | Removed |
| Local Keycloak docs/reports | Removed |
| Forbidden local reference scan | PASS, no matches for local Keycloak patterns |
| Django system check | PASS, 0 issues |

## Code Changes

| Area | Change |
|---|---|
| `backend/EcommerceProject/settings.py` | Removed the former local-Docker override path. Keycloak now reads only primary `.env` values. |
| `backend/.env` | Configured company Keycloak only: `KEYCLOAK_SERVER_URL`, `KEYCLOAK_REALM=Buy-Sell`, `KEYCLOAK_CLIENT_ID=admin-cli`, `KEYCLOAK_ADMIN_USERNAME=kcadmin`, `KEYCLOAK_ADMIN_PASSWORD`. |
| `backend/Customer/keycloak.py` | Uses Admin API against configured realm; admin token still targets `master`. Added client config lookup, redirect URI validation, role assignment logging, and `execute-actions-email`. |
| `backend/Customer/views.py` | Registration creates Keycloak user first, then persists Django profile data, assigns role, stores Keycloak user ID, and triggers Keycloak verification. |
| `backend/core/oidc_auth.py` | Bearer realm header now uses configured realm instead of a hardcoded local realm. |
| `src/providers/KeycloakProvider.jsx` | Dormant provider template now references company/env-only values, not local Docker defaults. |

## Registration Flow Status

Implemented flow:

1. Validate signup payload in Django.
2. Create user in company Keycloak first.
3. Set `emailVerified=false`.
4. Set `enabled=true`.
5. Assign role from account type:
   - personal -> `customer`
   - business -> `seller`
6. Trigger Keycloak `execute-actions-email` with action body:

```json
["VERIFY_EMAIL"]
```

7. Store `keycloak_user_id` in Django `Customer`.
8. Store local profile data.
9. Store business seller profile data for business accounts.
10. Track local verification state and sync from Keycloak.

Runtime verification against the company realm is blocked by the admin token failure below.

## Admin Token Validation

| Check | Result |
|---|---|
| Token URL | `https://iam.astropean.com/realms/master/protocol/openid-connect/token` |
| Client ID | `admin-cli` |
| Username | `kcadmin` |
| Status | FAIL, HTTP 401 |
| Error | `invalid_grant` / `Invalid user credentials` |

Required fix: provide a valid `KEYCLOAK_ADMIN_PASSWORD` for `kcadmin`, or confirm that `kcadmin` exists in the `master` realm and is allowed to use `admin-cli` with password grant/direct access grants.

## Verification Email Integration

| Requirement | Status |
|---|---|
| Do not send verification emails from Django | PASS |
| Use Keycloak as only verification engine | PASS in code |
| Use `execute-actions-email` | PASS in code |
| Required action `VERIFY_EMAIL` | PASS in code |
| Avoid legacy verification-mail endpoint | PASS, removed from active helper |
| Fix invalid redirect URI | PASS in code: redirect URI is only attached when valid for the selected client; otherwise it is omitted to prevent Keycloak rejecting the request. |

Because the only configured Keycloak client is `admin-cli`, the integration does not force a redirect URI into `execute-actions-email`. This avoids the previous `Invalid redirect uri` failure. Once a company frontend client is available, pass that client ID explicitly and ensure its valid redirect URIs include the configured frontend URL.

## Company Realm Checks

| Check | Result |
|---|---|
| Realm public discovery | PASS, HTTP 200 |
| Admin token | FAIL, HTTP 401 |
| Client configuration | BLOCKED by admin token failure |
| Valid redirect URIs | BLOCKED by admin token failure |
| Web origins | BLOCKED by admin token failure |
| Realm `verifyEmail` configuration | BLOCKED by admin token failure |
| SMTP configuration | BLOCKED by admin token failure |
| Role existence: `customer`, `seller` | BLOCKED by admin token failure |

## User Creation Result

Not executed against company Keycloak because admin token acquisition fails before Admin API access is possible.

Expected endpoint after credentials are fixed:

`POST /admin/realms/Buy-Sell/users`

Expected payload properties:

- `enabled=true`
- `emailVerified=false`
- `requiredActions=["VERIFY_EMAIL"]`
- `attributes.account_type`
- `attributes.business_name` when present

## Verification Email Trigger Result

Not executed against company Keycloak because admin token acquisition fails.

Expected endpoint after credentials are fixed:

`PUT /admin/realms/Buy-Sell/users/{user_id}/execute-actions-email`

Expected body:

```json
["VERIFY_EMAIL"]
```

## emailVerified Status

| Stage | Result |
|---|---|
| Before verification | BLOCKED by admin token failure |
| After verification | BLOCKED by admin token failure |
| Django sync from Keycloak | Implemented; live verification blocked by admin token failure |

## Role Assignment Result

Role assignment is implemented through realm role mapping:

`POST /admin/realms/Buy-Sell/users/{user_id}/role-mappings/realm`

Live role assignment is blocked until Admin API token acquisition succeeds.

## Redirect URI Configuration

Current backend redirect source: `SITE_URL` or `FRONTEND_URL` from env.

Current `.env` has `SITE_URL="http://127.0.0.1:8000"`. For production, set this to the actual frontend origin, for example:

```env
SITE_URL=https://<frontend-domain>
```

The backend builds:

```text
{SITE_URL}/verify-account?email={email}
```

The helper validates redirect URI against the target client when a client ID is supplied. With only `admin-cli` configured, redirect URI is omitted for `execute-actions-email` to avoid `Invalid redirect uri`.

## Remaining Blockers

High priority:

1. Fix company Keycloak admin authentication.
   - Confirm `kcadmin` exists in the `master` realm.
   - Confirm `KEYCLOAK_ADMIN_PASSWORD` is current.
   - Confirm `admin-cli` permits the password grant for this admin account.
   - Confirm `kcadmin` has permissions to manage users and roles in realm `Buy-Sell`.

2. Confirm company realm roles exist.
   - Required realm roles: `customer`, `seller`.

3. Confirm company SMTP configuration.
   - Keycloak must be able to send email from the company realm.

4. Confirm frontend redirect strategy.
   - If email verification should redirect to the frontend, provide a real company frontend client ID and configure valid redirect URIs/web origins in Keycloak.
   - With only `admin-cli`, the backend intentionally omits redirect URI to avoid invalid redirect failures.

## Final Decision

Code/config migration to company-only Keycloak: COMPLETE

End-to-end company Keycloak verification: BLOCKED BY INVALID ADMIN CREDENTIALS


# Authentication Verification Contract

## Registration

`POST /customer/register/`

Creates a Keycloak user with `enabled=true`, `emailVerified=false`, and `requiredActions=["VERIFY_EMAIL"]`, then creates a Django customer with `keycloak_user_id`, `is_verified=false`, `email_verified=false`, and `user_status="pending_verification"`.

Response: `201 Created`

```json
{
  "userId": 1,
  "status": "pending_verification"
}
```

Registration does not send the verification email automatically.

## Login

`POST /customer/login/`

Login is allowed when the email is not verified. Login only fails for invalid credentials, suspended users, or deleted users.

Response: `200 OK`

```json
{
  "access": "...",
  "refresh": "...",
  "emailVerified": false,
  "requiresEmailVerification": true,
  "userStatus": "pending_verification"
}
```

The response also includes the existing `token`, `userType`, and `user` fields for backwards compatibility.

## Verification Email

`GET /customer/send-email-verification-link/?email=user@example.com`

Triggers Keycloak `execute-actions-email` with `["VERIFY_EMAIL"]`, using `KEYCLOAK_VERIFICATION_CLIENT_ID` and `KEYCLOAK_VERIFICATION_REDIRECT_URI`.

## Status Sync

`GET /customer/verification-status/?email=user@example.com`

Reads Keycloak `emailVerified`. If Keycloak returns `emailVerified=true`, Django permanently stores `is_verified=true`, `email_verified=true`, `verification_timestamp=<now>`, and moves `user_status` to `active`.

Response when verified:

```json
{
  "verified": true,
  "status": "active"
}
```

Response when not verified:

```json
{
  "verified": false,
  "status": "pending_verification"
}
```

Profile refresh also syncs Keycloak verification status:

`GET /customer/profile/`

## OTP

OTP verification is disabled for account activation. Django does not send OTP emails and does not require mobile verification in this flow.

## Protected Actions

Order creation requires `email_verified=true`:

- `POST /orders/create-order/`

If email is not verified:

```json
{
  "message": "Please verify your email before placing an order."
}
```

The following actions require `user_status="active"`:

- `POST /orders/payments/create/`
- `/api/seller/*` business endpoints

Inactive users receive:

```json
{
  "message": "Email verification required."
}
```

Login, logout, profile view, product browsing, search, and wishlist are not blocked by email verification.

## End-To-End Verification Report

- Register user: Django and Keycloak users are created; Django status is `pending_verification`; Keycloak `emailVerified=false`.
- Send verification email: Django calls Keycloak `execute-actions-email` with configured client and redirect URI; Keycloak returns `204`.
- Click email link: Keycloak updates `emailVerified=true`.
- Verification status: Django reads Keycloak and persists `email_verified=true`, `is_verified=true`, and `user_status=active`.
- Login: succeeds with `requiresEmailVerification=false`; no OTP required.
- Place order: blocked until `email_verified=true`, then allowed.

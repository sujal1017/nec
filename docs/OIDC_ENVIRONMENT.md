# Keycloak / OIDC Environment Variables

## Overview

These environment variables configure Keycloak integration.
They are defined but NOT currently used for active authentication.
Existing SimpleJWT authentication remains active.

---

## Frontend (.env)

```env
# Keycloak OIDC Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=ecommerce
VITE_KEYCLOAK_CLIENT_ID=ecommerce-frontend

# Existing (unchanged)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Backend (backend/.env)

```env
# Keycloak - Existing (still used for admin API user creation)
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=admin-cli
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD

# OIDC - Infrastructure (not yet active)
OIDC_RP_CLIENT_ID=ecommerce-backend
OIDC_RP_CLIENT_SECRET=backend-client-secret
OIDC_OP_AUTHORIZATION_ENDPOINT=http://localhost:8080/realms/ecommerce/protocol/openid-connect/auth
OIDC_OP_TOKEN_ENDPOINT=http://localhost:8080/realms/ecommerce/protocol/openid-connect/token
OIDC_OP_USER_ENDPOINT=http://localhost:8080/realms/ecommerce/protocol/openid-connect/userinfo
OIDC_OP_JWKS_ENDPOINT=http://localhost:8080/realms/ecommerce/protocol/openid-connect/certs
OIDC_OP_LOGOUT_ENDPOINT=http://localhost:8080/realms/ecommerce/protocol/openid-connect/logout
OIDC_OP_ISSUER=http://localhost:8080/realms/ecommerce
OIDC_RP_SIGN_ALGO=RS256
```

## Docker (docker-compose.keycloak.yml)

```env
# Keycloak SMTP
KC_SMTP_HOST=smtp.gmail.com
KC_SMTP_PORT=587
KC_SMTP_USER=your-smtp-email@example.com
KC_SMTP_FROM=noreply@yourdomain.com
KC_SMTP_STARTTLS=true
KC_SMTP_SSL=false
```

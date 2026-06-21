# Keycloak Startup & Operations Guide

## Overview

This document covers starting, configuring, and operating Keycloak for the E-Commerce Platform.

**Current Status**: Infrastructure deployed in parallel. Active authentication unchanged.

---

## Prerequisites

- Docker Desktop 4.x+
- Docker Compose V2
- 4GB+ RAM allocated to Docker

---

## Quick Start

### 1. Generate Secrets

```bash
# Generate random passwords (PowerShell)
Add-Content -Path .\secrets\kc_admin_password.txt -Value ([System.Web.Security.Membership]::GeneratePassword(32, 4)) -NoNewline
Add-Content -Path .\secrets\kc_db_password.txt -Value ([System.Web.Security.Membership]::GeneratePassword(32, 4)) -NoNewline
Add-Content -Path .\secrets\kc_smtp_password.txt -Value "your-smtp-password" -NoNewline
```

### 2. Configure Environment

```bash
# Copy keycloak/.env.keycloak to keycloak/.env
# Edit values as needed
cp .\keycloak\.env.keycloak .\keycloak\.env
notepad .\keycloak\.env
```

### 3. Start Services

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

### 4. Verify Health

```bash
# Check container status
docker compose -f docker-compose.keycloak.yml ps

# Check Keycloak health endpoint
curl http://localhost:8080/health/ready

# Check Keycloak metrics
curl http://localhost:8080/metrics
```

### 5. Access Admin Console

- URL: http://localhost:8080
- Admin Console: http://localhost:8080/admin/master/console/
- Realm: master
- Username: admin
- Password: (value in secrets/kc_admin_password.txt)

---

## Keycloak URLs

| Service | URL | Description |
|---------|-----|-------------|
| Keycloak Server | http://localhost:8080 | Main Keycloak instance |
| Admin Console | http://localhost:8080/admin/master/console/ | Realm management UI |
| Account Console | http://localhost:8080/realms/ecommerce/account/ | User self-service |
| Realm | http://localhost:8080/realms/ecommerce | Realm root |
| OpenID Config | http://localhost:8080/realms/ecommerce/.well-known/openid-configuration | OIDC discovery |
| JWKS | http://localhost:8080/realms/ecommerce/protocol/openid-connect/certs | Public keys |
| Auth Endpoint | http://localhost:8080/realms/ecommerce/protocol/openid-connect/auth | Login redirect |
| Token Endpoint | http://localhost:8080/realms/ecommerce/protocol/openid-connect/token | Token exchange |
| UserInfo | http://localhost:8080/realms/ecommerce/protocol/openid-connect/userinfo | User profile |
| Logout | http://localhost:8080/realms/ecommerce/protocol/openid-connect/logout | Session logout |

---

## Realm Configuration (Pre-imported)

Realm **ecommerce** is pre-configured via `keycloak/realm-export.json`.

### Settings
- User Registration: Enabled
- Email as Username: Enabled
- Email Verification: Required
- Forgot Password: Enabled
- Remember Me: Enabled
- Brute Force Detection: Enabled (5 attempts)
- Password Policy: 8+ chars, upper, lower, digit, special

### Customization After First Start

1. **SMTP Configuration**
   - Realm Settings → Email → SMTP
   - Update from environment values

2. **Identity Providers** (Social Login)
   - Identity Providers → Add
   - Configure Google/Facebook/Apple as needed

3. **Themes**
   - Custom theme directory: `keycloak/themes/ecommerce/`
   - Restart required to pick up theme changes

---

## Clients

### Frontend Client (ecommerce-frontend)

| Property | Value |
|----------|-------|
| Client ID | `ecommerce-frontend` |
| Type | Public (no secret) |
| Protocol | OpenID Connect |
| Auth Flow | Standard (Authorization Code) |
| PKCE | S256 (mandatory) |
| Redirect URIs | `http://localhost:5173/*` |
| Web Origins | `http://localhost:5173` |
| Post Logout URI | `http://localhost:5173/*` |

**Token Mappings:**
- `account_type` → User Attribute → Token claim
- `business_name` → User Attribute → Token claim
- Realm roles → `realm_access.roles`

### Backend Client (ecommerce-backend)

| Property | Value |
|----------|-------|
| Client ID | `ecommerce-backend` |
| Type | Confidential (requires secret) |
| Protocol | OpenID Connect |
| Auth Flow | Authorization Code + Direct Access |
| Service Account | Enabled |
| Redirect URIs | `http://localhost:8000/*` |

**Client Roles:**
- `profile:read`, `profile:write`
- `orders:read`, `orders:write`

---

## Docker Commands

```bash
# Start all services
docker compose -f docker-compose.keycloak.yml up -d

# View logs
docker compose -f docker-compose.keycloak.yml logs -f

# View Keycloak logs only
docker compose -f docker-compose.keycloak.yml logs -f keycloak

# View PostgreSQL logs only
docker compose -f docker-compose.keycloak.yml logs -f postgres

# Stop services
docker compose -f docker-compose.keycloak.yml down

# Stop and remove volumes (destructive)
docker compose -f docker-compose.keycloak.yml down -v

# Restart Keycloak only
docker compose -f docker-compose.keycloak.yml restart keycloak

# Scale (not supported in dev mode)
docker compose -f docker-compose.keycloak.yml up -d --scale keycloak=1

# Check resource usage
docker stats ecommerce-keycloak ecommerce-keycloak-db

# Backup realm
docker exec ecommerce-keycloak /opt/keycloak/bin/kc.sh export --dir /tmp/export --realm ecommerce
docker cp ecommerce-keycloak:/tmp/export ./keycloak/backup/
```

---

## Production Checklist

Before moving to production:

- [ ] Set `KC_HOSTNAME_STRICT=true`
- [ ] Set `KC_HOSTNAME_STRICT_HTTPS=true`
- [ ] Configure proper TLS/SSL (reverse proxy or built-in)
- [ ] Update redirect URIs with production domains
- [ ] Configure SMTP with verified sender
- [ ] Set up Keycloak metrics monitoring
- [ ] Configure regular database backups
- [ ] Set up health check monitoring
- [ ] Disable `start-dev` and use production mode
- [ ] Review and customize email templates
- [ ] Set up identity providers
- [ ] Configure session policies for production
- [ ] Audit realm roles and permissions

---

## Troubleshooting

### Keycloak won't start
```bash
# Check logs
docker compose -f docker-compose.keycloak.yml logs keycloak

# Verify DB connection
docker compose -f docker-compose.keycloak.yml exec postgres pg_isready -U keycloak

# Reset DB volume if corrupt
docker compose -f docker-compose.keycloak.yml down -v
docker compose -f docker-compose.keycloak.yml up -d
```

### Realm import failed
- Check `realm-export.json` syntax with a JSON validator
- Ensure PostgreSQL is healthy before Keycloak starts
- Look for `ERROR` in Keycloak startup logs

### "Unable to fetch JWKS"
- Verify Keycloak is running: `curl http://localhost:8080/realms/ecommerce`
- Check JWKS endpoint: `curl http://localhost:8080/realms/ecommerce/protocol/openid-connect/certs`
- Verify network connectivity between Django and Keycloak

### Token validation errors
- Verify backend client secret matches
- Check clock skew between services (NTP sync)
- Confirm RS256 is the signing algorithm (default)

---

## Backup and Restore

### Automated Backup Script

```bash
#!/bin/bash
# backup-keycloak.sh
BACKUP_DIR="./keycloak/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Export realm
docker exec ecommerce-keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/backup --realm ecommerce
docker cp ecommerce-keycloak:/tmp/backup "$BACKUP_DIR/realm"

# Backup database
docker exec ecommerce-keycloak-db pg_dump -U keycloak keycloak > "$BACKUP_DIR/db.sql"

echo "Backup saved to $BACKUP_DIR"
```

### Manual Restore

```bash
# Stop Keycloak
docker compose -f docker-compose.keycloak.yml stop keycloak

# Restore database
docker exec -i ecommerce-keycloak-db psql -U keycloak keycloak < backup.sql

# Import realm (start Keycloak with import)
docker compose -f docker-compose.keycloak.yml up -d keycloak
```

# KEYCLOAK COMPLIANCE REPORT
**Date:** 2026-06-21

---

## 1. REGISTRATION KEYCLOAK INTEGRATION

### Current Implementation (`keycloak.py`)
```python
def create_keycloak_user(*, username, email, first_name, last_name, password):
    payload = {
        'username': username,
        'email': email,
        'firstName': first_name,
        'lastName': last_name,
        'enabled': True,
        'emailVerified': False,       # ✅ Correct
        'credentials': [{'type': 'password', 'value': password, 'temporary': False}],
    }
    response = requests.post(user_url, json=payload, headers=headers, timeout=15)
```

### Compliance Check

| Requirement | Status | Evidence |
|-------------|--------|----------|
| `emailVerified=false` during registration | ✅ | `'emailVerified': False` in payload |
| Keycloak user created before DB commit | ✅ | In `transaction.atomic()` block |
| `keycloak_user_id` stored in Customer | ✅ | `customer.keycloak_user_id = create_keycloak_user(...)` |
| Rollback on Keycloak failure | ✅ | `transaction.atomic()` rolls back DB if Keycloak fails |
| Rollback on DB failure deletes Keycloak user | ✅ | `delete_keycloak_user()` in exception handler |
| Unique constraint on `keycloak_user_id` | ✅ | `null=True, unique=True` in model |

---

## 2. KEYCLOAK CONFIGURATION

### Settings
```python
KEYCLOAK_SERVER_URL = config('KEYCLOAK_SERVER_URL')  # https://iam.astropean.com
KEYCLOAK_REALM = config('KEYCLOAK_REALM')              # Buy-Sell
KEYCLOAK_CLIENT_ID = config('KEYCLOAK_CLIENT_ID')      # admin-cli
KEYCLOAK_CLIENT_SECRET = config('KEYCLOAK_CLIENT_SECRET')  # (empty)
KEYCLOAK_ADMIN_USERNAME = config('KEYCLOAK_ADMIN_USERNAME')  # kcadmin
KEYCLOAK_ADMIN_PASSWORD = config('KEYCLOAK_ADMIN_PASSWORD')
```

### Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| External production server | **MEDIUM** | Points to `iam.astropean.com` — no local dev Keycloak |
| Empty client secret | **LOW** | `admin-cli` is a public client, but `KEYCLOAK_CLIENT_SECRET` is empty |
| No connection health check | **LOW** | No startup validation that Keycloak is reachable |
| Hardcoded timeout | **LOW** | `timeout=15` hardcoded in all requests |

---

## 3. KEYCLOAK USER SYNC

### Registration Flow
```
Client → RegisterCustomer.post()
  → transaction.atomic()
    → Customer.objects.create_user()           # creates DB record
    → SellerProfile.objects.create() (if biz)   # creates seller profile  
    → create_keycloak_user()                    # creates Keycloak user
    → customer.keycloak_user_id = keycloak_id   # stores Keycloak ID
  → exception? 
    → delete_keycloak_user()                    # cleanup
```

✅ Both DB and Keycloak remain synchronized.

### Google Login Flow
```
Client → GoogleLogin.post()
  → Customer.objects.get_or_create()    # creates DB record ONLY
  → NO Keycloak user created            # ❌ MISSING
```

❌ Users registered via Google have no Keycloak record → auth drift.

### Login Flow
```
Client → CustomerTokenObtainPairView.post()
  → authenticate()                     # Django auth (local DB)
  → Issues JWT                         # SimpleJWT from local DB
```

⚠️ Keycloak is NOT consulted during login. Django handles all authentication locally. Keycloak is used only as a user store.

---

## 4. KEYCLOAK USER FIELDS MAPPING

| Keycloak Field | Django Field | Synced? |
|----------------|-------------|---------|
| `username` | `Customer.username` | ✅ |
| `email` | `Customer.email` | ✅ |
| `firstName` | `Customer.first_name` | ✅ |
| `lastName` | `Customer.last_name` | ✅ |
| `emailVerified` | `Customer.is_verified` | ❌ Never synced back |
| `enabled` | `Customer.user_status` | ❌ Never synced back |
| `id` | `Customer.keycloak_user_id` | ✅ (stored) |

---

## 5. SYNC GAPS

| Gap | Impact |
|-----|--------|
| Keycloak `emailVerified` never updated when user verifies email | Keycloak shows unverified even after Django verification |
| Keycloak `enabled` never linked to `user_status` | Suspended users remain enabled in Keycloak |
| Google users have no Keycloak record | Half the users are invisible to Keycloak |
| No periodic sync mechanism | Drift accumulates over time |

---

## 6. COMPLIANCE SCORE

| Requirement | Compliance |
|-------------|-----------|
| `emailVerified=false` during registration | ✅ **100%** |
| `keycloak_user_id` stored | ✅ **100%** |
| Transactional consistency (DB + Keycloak) | ✅ **100%** |
| Rollback on failure | ✅ **100%** |
| Google login Keycloak sync | ❌ **0%** |
| Post-verification sync | ❌ **0%** |
| Bi-directional sync | ❌ **0%** |
| **Overall** | **43%** |

---

## 7. RECOMMENDATIONS

### P0 — Fix broken email verification (PREREQUISITE for Keycloak sync)
1. Fix `VerifyEmail.get()` indentation

### P1 — Add Keycloak sync for Google login
2. Create Keycloak user in `GoogleLogin.post()` when user is created
3. Create SellerProfile for business Google users

### P2 — Improve Keycloak sync
4. Update Keycloak `emailVerified` when user verifies email
5. Sync Keycloak `enabled` status when user is suspended
6. Add a management command for periodic sync

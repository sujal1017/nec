# AUTH AUDIT REPORT
**Date:** 2026-06-21  
**Project:** E-comm_team_1  
**Auditor:** System Analysis

---

## 1. REGISTRATION FLOW

### Frontend: `Register.jsx`
- Sends `POST /customer/register/` with ~20+ field aliases (full_name, email, mobile, password, accountType, businessName, etc.)
- Validates client-side: firstName, lastName, email, phone, password, confirmPassword, business fields, agreeTerms
- On success → navigates to `/signin` with `{ registered: true }` state
- On error → maps backend field errors using `getApiFieldErrors()`, shows `getApiErrorMessage()`
- Google button calls `useGoogleOAuth` hook → populates form fields

### Backend: `RegisterCustomer` (views.py)
- Duplicate email check: ✅ Returns `{"email": ["Email already exists"]}` status 409
- Duplicate mobile check: ✅ Returns `{"mobile": ["Mobile already exists"]}` status 409
- Serializer validation: ✅ Uses `RegisterCustomerSerializer` with field-level validators
- Transaction: ✅ Uses `transaction.atomic()`
- Keycloak: ✅ Calls `create_keycloak_user()` with `emailVerified=False`
- SellerProfile: ✅ Created for business accounts
- Verification email: ✅ `VerifyEmail.send_verification_email()` called
- Audit log: ✅ `create_auth_audit_log(request, ACTION_REGISTER, customer)`
- Rollback: ✅ Keycloak user deleted if DB fails after creation
- Response: ✅ Returns `{"userId": id, "status": "pending_verification", "message": "Verification email sent"}`

**STATUS: WORKING** ✅

---

## 2. EMAIL VERIFICATION FLOW

### Frontend: `VerifyEmail.jsx` (at `src/pages/VerifyEmail.jsx`)
- Reads `token` from URL query params
- Calls `GET /customer/verify-email/?token=...`
- Shows: loading → success/expired/error states
- On success: stores email in session/localStorage → redirects to `/verify-otp`
- On expired/invalid: shows "Link expired" with buttons to signin or register

### Backend: `VerifyEmail` class (views.py)
- `send_verification_email()`: ✅ Builds link with `generate_email_token()` → sends email
- `build_verification_link()`: ✅ Creates link pointing to `{SITE_URL}/verifyEmail?token={token}`
- **CRITICAL BUG:** `get()` method at line ~345 is defined at MODULE LEVEL (indent 0), NOT inside the class. `VerifyEmail.as_view()` will NOT route GET requests to this method. The method will never execute.
- No proper GET handler inside the class → API call will fail with 405 Method Not Allowed

**STATUS: BROKEN** ❌ (get() is a standalone function, not a class method)

---

## 3. OTP FLOW

### Frontend: `VerifyOTP.jsx` (at `src/pages/VerifyOTP.jsx`)
- Reads email from session/localStorage
- Sends `POST /customer/otp/verify/` with email + otp
- Shows success → redirects to `/signin`
- Has resend button → `POST /customer/otp/resend/`
- Validates OTP is 6 digits

### Backend: `VerifyOTP` class
- Validates email exists
- Validates user is verified
- Validates OTP exists and not expired and not used
- Sets `user_status = STATUS_ACTIVE` on success
- Creates audit log ✅
- Returns `{"message": "OTP verified", "status": "active"}` ✅

### Backend: `ResendOTP` class
- Max 3 attempts per 10 minutes ✅
- Creates new OTP record ✅

### Backend: `GenerateOTP` class
- Creates OTP and sends email ✅

**STATUS: WORKING** ✅

---

## 4. LOGIN FLOW

### Frontend: `Login.jsx`
- Sends `POST /customer/login/` with email + password
- On success: calls `setAuth(authData)` → `AuthContext` stores in localStorage
- On error: shows backend error message
- Google login: calls `googleLogin()` → `POST /customer/google-login/`

### Backend: `CustomerTokenObtainPairView` (mapped to `login/`)
- Uses `CustomerTokenObtainPairSerializer`
- Checks: `user.is_verified and user_status == STATUS_ACTIVE`
- If not: raises generic "Please verify your email before logging in."
- **BUG:** Does NOT distinguish between:
  - `pending_verification` → should say "Verify your email first"
  - `pending_otp` → should say "Complete OTP verification"
  - `suspended` → should say "Account suspended"
- On success: returns token, refresh, userType, user ✅

### Backend: `CustomerLogin` (mapped to `customlogin/`)
- Legacy view using forms
- Same generic message issue
- **REDUNDANT** — duplicates `CustomerTokenObtainPairView`

**STATUS: PARTIALLY WORKING** ⚠️ (login works but status-specific messages missing)

---

## 5. GOOGLE LOGIN FLOW

### Frontend: `authService.googleLogin()`
- Gets user info from Google API with access token
- Calls `POST /customer/google-login/` with email, firstName, lastName, googleId, accountType
- If `requires_verification`: stores email, throws error with `requiresVerification=true`
- On success: persists auth, returns authData

### Backend: `GoogleLogin` class
- Creates user if not exists: `is_verified=False`, `STATUS_PENDING_VERIFICATION`
- Sends verification email for new users ✅
- Existing user not verified → returns 401 with `requires_verification: True` ✅
- Existing user verified → issues tokens ✅
- **MISSING:** No Keycloak user creation for Google login
- **MISSING:** No SellerProfile creation when account_type is business

**STATUS: PARTIALLY WORKING** ⚠️ (no Keycloak sync, no SellerProfile for business)

---

## 6. JWT FLOW

### Backend: `SIMPLE_JWT` settings
- `ACCESS_TOKEN_LIFETIME`: 1 day ✅
- `REFRESH_TOKEN_LIFETIME`: 7 days ✅
- Token refresh at `/customer/refresh/` ✅

### Frontend: `authService.js`
- `isValidAccessToken()`: Decodes JWT, checks `token_type === "access"` and `exp`
- `persistAuth()`: Stores in localStorage or sessionStorage
- `readStoredAuth()`: Reads and validates stored auth
- `clearStoredAuth()`: Clears all storage ✅

### Frontend: `api.js` interceptor
- Attaches Bearer token from storage to all non-public requests
- Clears auth on 401 with `token_not_valid`
- Public endpoints list excludes auth

**STATUS: WORKING** ✅

---

## 7. KEYCLOAK FLOW

### Backend: `keycloak.py`
- `get_keycloak_admin_token()`: Authenticates with admin credentials ✅
- `create_keycloak_user()`: Creates user with `emailVerified=False` ✅
- `delete_keycloak_user()`: Deletes user by ID ✅
- Points to `KEYCLOAK_SERVER_URL=https://iam.astropean.com` (external/production server)

### Integration
- Called during `RegisterCustomer.post()` ✅
- `keycloak_user_id` stored in Customer model ✅
- Rollback on failure ✅
- **MISSING:** No Keycloak user creation in GoogleLogin flow
- **MISSING:** No Keycloak user status sync (emailVerified, enabled)
- **MISSING:** No Keycloak user lookup by email

**STATUS: PARTIALLY WORKING** ⚠️

---

## 8. SELLER REGISTRATION FLOW

### Backend: `RegisterCustomer.post()`
- Checks `customer.account_type == "business"`
- Creates `SellerProfile` with business fields ✅
- Uses `transaction.atomic()` → rolled back on any failure ✅

### Validation
- Serializer requires business fields when `account_type == "business"` ✅
- Frontend shows business fields conditionally ✅

**STATUS: WORKING** ✅

---

## 9. BUSINESS PROFILE CREATION

### Model: `SellerProfile`
- OneToOne to Customer ✅
- Fields: business_name, business_registration_number, business_email, business_phone, business_address, tax_id, gst_number ✅

### Missing
- No API endpoint to update SellerProfile after registration
- No API endpoint to GET SellerProfile
- No frontend page to view/edit seller profile

**STATUS: PARTIALLY WORKING** ⚠️

---

## 10. SECURITY ANALYSIS

| Issue | Severity | Location |
|-------|----------|----------|
| `VerifyEmail.get()` at module level (dead code) | **CRITICAL** | views.py ~L345 |
| Login doesn't distinguish user status in error messages | **HIGH** | views.py (CustomerTokenObtainPairSerializer) |
| Google login doesn't create Keycloak user | **HIGH** | views.py GoogleLogin |
| Google login doesn't create SellerProfile for business | **MEDIUM** | views.py GoogleLogin |
| `CustomerLogin` view is redundant with JWT view | **LOW** | views.py |
| Keycloak points to external production server | **NOTE** | keycloak.py |
| `CORS_ALLOW_ALL_ORIGINS = True` | **MEDIUM** | settings.py |
| `DEBUG = True` | **HIGH** | settings.py |
| No rate limiting on login endpoint | **MEDIUM** | views.py |
| OTP rate limiting (3 per 10min) present | **GOOD** | ResendOTP |

---

## 11. USER STORY COMPLIANCE

| Requirement | Status |
|-------------|--------|
| User Type Selection (Personal/Business) | ✅ |
| Default Personal | ✅ |
| Full Name | ✅ |
| Email | ✅ |
| Mobile | ✅ |
| Password | ✅ |
| Business Name | ✅ |
| Business Registration Number | ✅ |
| Tax ID | ✅ |
| Business Address | ✅ |
| POST /api/signup → userId + pending_verification | ✅ |
| Duplicate email → 409 | ✅ |
| Duplicate mobile → 409 | ✅ |
| Email verification flow | ❌ (get() broken) |
| OTP flow | ✅ |
| OTP resend with max 3 attempts | ✅ |
| Login blocks unverified users | ✅ |
| Login distinguishes status messages | ❌ |
| Google login creates Keycloak user | ❌ |
| Google login creates SellerProfile for business | ❌ |
| Keycloak emailVerified=false on registration | ✅ |
| Keycloak user ID stored | ✅ |
| Transaction atomicity | ✅ |
| Audit logging | ✅ |
| IP logging | ✅ |

**Overall Compliance: ~80%** (16/20 requirements met)

---

## 12. MISSING FILES

| Expected Path | Actual Path | Status |
|--------------|-------------|--------|
| `src/pages/auth/VerifyEmail.jsx` | `src/pages/VerifyEmail.jsx` | LOCATION MISMATCH |
| `src/pages/auth/VerifyOTP.jsx` | `src/pages/VerifyOTP.jsx` | LOCATION MISMATCH |
| `src/components/ProtectedRoute.jsx` | `src/guards/ProtectedRoute.jsx` | LOCATION MISMATCH |

---

## 13. CRITICAL BUGS SUMMARY

1. **`VerifyEmail.get()` is a standalone function** → Email verification API always fails
2. **Login status messages are generic** → User can't tell if they need email or OTP verification
3. **Google login doesn't create Keycloak users** → Auth drift between DB and Keycloak
4. **Google business login doesn't create SellerProfile** → Business users via Google have no profile

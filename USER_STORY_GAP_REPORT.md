# USER STORY GAP REPORT
**Date:** 2026-06-21

---

## REQUIREMENT CHECKLIST

### Registration API (`POST /api/signup`)

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 1 | User Type Selection | `userType` field in request | ✅ `account_type` field, also accepts `userType`, `accountType` | None |
| 2 | Default Personal | Default to "personal" | ✅ `default="personal"` in serializer | None |
| 3 | Full Name | `fullName` field | ✅ `full_name` accepted, also built from `firstName` + `lastName` | None |
| 4 | Email | `email` field | ✅ `email` required | None |
| 5 | Mobile | `mobile` field | ✅ `mobile` required, also accepts `phone`, `phoneno` | None |
| 6 | Password | `password` field | ✅ `password` required | None |
| 7 | Business Name | `businessName` field | ✅ `business_name` accepted when account_type=business | None |
| 8 | Business Reg Number | `businessRegistrationNumber` field | ✅ `business_registration_number` accepted | None |
| 9 | Tax ID | `taxId` field | ✅ `tax_id` accepted | None |
| 10 | Business Address | `businessAddress` field | ✅ `business_address` accepted | None |

### Request Format

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 11 | Request camelCase | `fullName`, `userType` etc. | ✅ Serializer `to_internal_value()` maps camelCase → snake_case | None |
| 12 | Request JSON format | `{"userType":"personal",...}` | ✅ Frontend sends JSON | None |

### Response Format

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 13 | Success response ID | `"userId": 123` | ✅ `"userId": customer.id` returned | None |
| 14 | Success response status | `"status": "pending_verification"` | ✅ `"status": customer.user_status` returned | None |
| 15 | Duplicate email | 409 | ✅ Status 409 with `{"email": ["Email already exists"]}` | None |
| 16 | Duplicate mobile | 409 | ✅ Status 409 with `{"mobile": ["Mobile already exists"]}` | None |

### Registration Flow Steps

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 17 | Validate input | All fields validated | ✅ Serializer validates all fields | None |
| 18 | Check duplicate email | 409 if exists | ✅ Checked before serializer | None |
| 19 | Check duplicate mobile | 409 if exists | ✅ Checked before serializer | None |
| 20 | Create Keycloak user | emailVerified=false | ✅ `keycloak.py` creates with `emailVerified=False` | None |
| 21 | Create Customer | status=pending_verification | ✅ `user_status = STATUS_PENDING_VERIFICATION` | None |
| 22 | Create SellerProfile if business | Created | ✅ Created in transaction | None |
| 23 | Send verification email | Sent | ✅ `VerifyEmail.send_verification_email()` | None |
| 24 | Transaction atomicity | All-or-nothing | ✅ `transaction.atomic()` used | None |
| 25 | Rollback on Keycloak failure | Customer not created | ✅ Atomic — Keycloak failure rolls back DB | None |
| 26 | Rollback on DB failure | Keycloak user deleted | ✅ Keycloak user deleted in exception handler | None |
| 27 | Audit logging | Logged | ✅ `create_auth_audit_log(ACTION_REGISTER)` | None |
| 28 | IP logging | IP captured | ✅ `get_client_ip()` called | None |

### Email Verification Flow

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 29 | User clicks email link | Token verified | ❌ **`VerifyEmail.get()` is at module level, not a class method** | CRITICAL |
| 30 | Set is_verified=True | Updated | ✅ Inside the standalone `get()` function | PARTIAL |
| 31 | Set user_status=pending_otp | Updated | ✅ Inside the standalone `get()` function | PARTIAL |
| 32 | Generate OTP | Created | ✅ `create_otp_for_user()` called | PARTIAL |
| 33 | Store OTP | In DB | ✅ `OTPVerification.objects.create()` | PARTIAL |
| 34 | Send OTP email | Sent | ✅ `send_otp_email()` called | PARTIAL |
| 35 | Response status "pending_otp" | Returned | ❌ Returns `{"msg":"Email verified...","email":...}` not `{"status":"pending_otp"}` | MINOR |

### OTP Verification Flow

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 36 | POST /customer/otp/verify/ | Endpoint exists | ✅ `VerifyOTP` class | None |
| 37 | Request: email + otp | Both required | ✅ Validates both | None |
| 38 | Validate OTP exists | Checked | ✅ `user.otp_verifications.filter(verified=False).first()` | None |
| 39 | Validate OTP not expired | Checked | ✅ `otp_record.is_expired()` | None |
| 40 | Validate OTP not used | Checked | ✅ `verified=False` filter | None |
| 41 | Set user_status=active | Updated | ✅ `user.user_status = STATUS_ACTIVE` | None |
| 42 | Set OTP verified | Updated | ✅ `otp_record.verified = True` | None |
| 43 | Audit log | Logged | ✅ `create_auth_audit_log(ACTION_OTP_VERIFICATION)` | None |
| 44 | Response `{"status":"active"}` | Returned | ✅ `{"message":"OTP verified","status":"active"}` | None |
| 45 | Resend OTP max 3 times | Enforced | ✅ `attempts >= 3` check | None |
| 46 | Resend OTP per 10 minutes | Window check | ✅ `window_start = now - 10min` | None |
| 47 | Invalid OTP error | Returned | ✅ `{"otp":["Invalid OTP"]}` | None |
| 48 | Expired OTP error | Returned | ✅ `{"detail":"OTP expired."}` | None |
| 49 | Attempts exceeded error | Returned | ✅ `{"detail":"Maximum OTP resend attempts..."}` | None |

### Login Flow

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 50 | Login denied: pending_verification | "Verify your email first" | ❌ Returns generic "Please verify your email before logging in." | MISSING |
| 51 | Login denied: pending_otp | "Complete OTP verification" | ❌ Same generic message | MISSING |
| 52 | Login denied: suspended | "Account suspended" | ❌ Same generic message | MISSING |
| 53 | Login success: access token | Returned | ✅ `access_token` in response | None |
| 54 | Login success: refresh token | Returned | ✅ `refresh` in response | None |
| 55 | Login success: userType | Returned | ✅ `userType` in response | None |

### Google Login

| # | Requirement | Expected | Actual | Gap |
|---|-------------|----------|--------|-----|
| 56 | Google login creates user | Created if new | ✅ `get_or_create` used | None |
| 57 | Google login creates Keycloak user | Created | ❌ **No Keycloak user created** | HIGH |
| 58 | Google business login creates SellerProfile | Created | ❌ **No SellerProfile created for business** | MEDIUM |

---

## SUMMARY

| Category | Total | Met | Gap | % |
|----------|-------|-----|-----|----|
| Registration API | 16 | 16 | 0 | 100% |
| Registration Flow | 12 | 12 | 0 | 100% |
| Email Verification | 7 | 2 | 5 | 29% |
| OTP Verification | 14 | 14 | 0 | 100% |
| Login Flow | 6 | 3 | 3 | 50% |
| Google Login | 3 | 1 | 2 | 33% |
| **TOTAL** | **58** | **48** | **10** | **83%** |

---

## GAPS REQUIRING FIXES

### P0 — CRITICAL (Broken functionality)
1. **VerifyEmail.get() is a standalone function** — fix indentation so it's inside the class
2. **Email verification response** — change to return `{"status": "pending_otp"}`

### P1 — HIGH (User story deviation)
3. **Login status messages** — differentiate `pending_verification`, `pending_otp`, `suspended`
4. **Google login creates Keycloak user** — add Keycloak user creation

### P2 — MEDIUM (Missing feature)
5. **Google business login creates SellerProfile** — add SellerProfile creation for business users

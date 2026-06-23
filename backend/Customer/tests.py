from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from .services import sync_keycloak_verification
from .models import Customer


class AuthenticationVerificationFlowTests(APITestCase):
    def create_customer(self, user_status=Customer.STATUS_PENDING_VERIFICATION, is_verified=False, **extra):
        defaults = {
            "username": extra.pop("username", "pending@example.com"),
            "email": extra.pop("email", "pending@example.com"),
            "name": extra.pop("name", "Pending User"),
            "password": extra.pop("password", "StrongPass1!"),
            "is_verified": is_verified,
            "user_status": user_status,
        }
        defaults.update(extra)
        return Customer.objects.create_user(**defaults)

    @patch("Customer.views.send_keycloak_verification_email")
    @patch("Customer.views.assign_keycloak_role")
    @patch("Customer.views.create_keycloak_user", return_value="kc-user-1")
    def test_registration_creates_pending_user_without_sending_email(self, create_kc, assign_role, send_email):
        response = self.client.post(
            "/customer/register/",
            {
                "full_name": "Pending User",
                "email": "pending@example.com",
                "mobile": "+919999999999",
                "password": "StrongPass1!",
                "account_type": "personal",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = Customer.objects.get(email="pending@example.com")
        self.assertFalse(user.is_verified)
        self.assertFalse(user.email_verified)
        self.assertFalse(user.phone_verified)
        self.assertEqual(user.user_status, Customer.STATUS_PENDING_VERIFICATION)
        self.assertEqual(user.keycloak_user_id, "kc-user-1")
        self.assertEqual(response.data["status"], Customer.STATUS_PENDING_VERIFICATION)
        create_kc.assert_called_once()
        assign_role.assert_called_once_with("kc-user-1", "customer")
        send_email.assert_not_called()

    @patch("Customer.views._sync_keycloak_verification", return_value=False)
    def test_pending_verification_user_can_login_and_receives_verification_contract(self, _sync):
        self.create_customer()

        response = self.client.post(
            "/customer/login/",
            {"username": "pending@example.com", "password": "StrongPass1!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["emailVerified"], False)
        self.assertEqual(response.data["requiresEmailVerification"], True)
        self.assertEqual(response.data["requiresVerification"], True)
        self.assertEqual(response.data["userStatus"], Customer.STATUS_PENDING_VERIFICATION)

    @patch("Customer.views.send_keycloak_verification_email")
    @patch("Customer.views.build_keycloak_verification_redirect_uri", return_value="http://localhost:5173/verify-account?email=pending@example.com")
    @patch("Customer.views.ensure_keycloak_account_for_user", return_value="kc-user-1")
    def test_verify_email_action_triggers_keycloak_execute_actions_email(self, ensure_kc, redirect_uri, send_email):
        user = self.create_customer()

        response = self.client.get("/customer/send-email-verification-link/?email=pending@example.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["msg"], "Verification email sent")
        ensure_kc.assert_called_once_with(user)
        redirect_uri.assert_called_once_with(user.email)
        send_email.assert_called_once_with(
            "kc-user-1",
            client_id="admin-cli",
            redirect_uri="http://localhost:5173/verify-account?email=pending@example.com",
        )

    @patch("Customer.services.get_keycloak_user_status", return_value={"emailVerified": True, "enabled": True, "requiredActions": []})
    def test_keycloak_email_verified_persists_to_database(self, _status):
        user = self.create_customer()
        user.keycloak_user_id = "kc-user-1"
        user.save(update_fields=["keycloak_user_id"])

        self.assertTrue(sync_keycloak_verification(user))

        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertTrue(user.email_verified)
        self.assertIsNotNone(user.verification_timestamp)
        self.assertEqual(user.user_status, Customer.STATUS_ACTIVE)

    def test_otp_endpoints_are_disabled(self):
        generate = self.client.post("/customer/otp/generate/", {"email": "pending@example.com"}, format="json")
        resend = self.client.post("/customer/otp/resend/", {"email": "pending@example.com"}, format="json")
        verify = self.client.post("/customer/otp/verify/", {"email": "pending@example.com", "otp": "123456"}, format="json")

        self.assertEqual(generate.status_code, status.HTTP_410_GONE)
        self.assertEqual(resend.status_code, status.HTTP_410_GONE)
        self.assertEqual(verify.status_code, status.HTTP_410_GONE)

    @patch("Customer.views._sync_keycloak_verification", return_value=True)
    def test_verified_email_login_requires_no_otp(self, _sync):
        user = self.create_customer(
            is_verified=True,
            email_verified=True,
            user_status=Customer.STATUS_ACTIVE,
        )

        response = self.client.post(
            "/customer/login/",
            {"username": user.email, "password": "StrongPass1!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["emailVerified"], True)
        self.assertEqual(response.data["requiresEmailVerification"], False)
        self.assertEqual(response.data["userStatus"], Customer.STATUS_ACTIVE)

    @patch("Customer.views._sync_keycloak_verification", return_value=False)
    def test_suspended_and_deleted_users_cannot_login(self, _sync):
        self.create_customer(username="suspended@example.com", email="suspended@example.com", user_status=Customer.STATUS_SUSPENDED)
        self.create_customer(username="deleted@example.com", email="deleted@example.com", user_status=Customer.STATUS_DELETED)

        suspended = self.client.post(
            "/customer/login/",
            {"username": "suspended@example.com", "password": "StrongPass1!"},
            format="json",
        )
        deleted = self.client.post(
            "/customer/login/",
            {"username": "deleted@example.com", "password": "StrongPass1!"},
            format="json",
        )

        self.assertEqual(suspended.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(deleted.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_active_account_permission_returns_required_message(self):
        user = self.create_customer()
        self.client.force_authenticate(user=user)

        order_response = self.client.post("/orders/create-order/", {}, format="json")
        payment_response = self.client.post("/orders/payments/create/", {"order_id": 1}, format="json")

        self.assertEqual(order_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(payment_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(str(order_response.data["message"]), "Please verify your email before placing an order.")
        self.assertEqual(str(payment_response.data["message"]), "Email verification required.")

    def test_business_features_require_active_status(self):
        user = self.create_customer(
            username="seller@example.com",
            email="seller@example.com",
            account_type="business",
            business_name="Seller Co",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/seller/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(str(response.data["message"]), "Email verification required.")

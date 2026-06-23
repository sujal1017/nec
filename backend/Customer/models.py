from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField
from django.utils import timezone
from datetime import timedelta

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField


class Customer(AbstractUser):
    ACCOUNT_TYPE_CHOICES = (
        ("personal", "Personal"),
        ("business", "Business"),
    )
    STATUS_PENDING_VERIFICATION = "pending_verification"
    STATUS_PENDING_OTP = "pending_otp"
    STATUS_ACTIVE = "active"
    STATUS_SUSPENDED = "suspended"
    STATUS_DELETED = "deleted"
    USER_STATUS_CHOICES = (
        (STATUS_PENDING_VERIFICATION, "Pending Verification"),
        (STATUS_PENDING_OTP, "Pending OTP"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_DELETED, "Deleted"),
    )
    # already has:
    # username, first_name, last_name
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)  # important âœ…
    phoneno = PhoneNumberField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    verification_timestamp = models.DateTimeField(null=True, blank=True)
    phone_verification_timestamp = models.DateTimeField(null=True, blank=True)
    user_status = models.CharField(
        max_length=30,
        choices=USER_STATUS_CHOICES,
        default=STATUS_PENDING_VERIFICATION,
    )
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default="personal")
    business_name = models.CharField(max_length=150, blank=True, default="")
    keycloak_user_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.first_name} {self.last_name})"
    
class CustomerAddress(models.Model):
    custId = models.ForeignKey(
        Customer,
        to_field="username",
        on_delete=models.CASCADE,
        related_name="addresses" #must be unique in Customer
    )
    label = models.CharField(max_length=200, null=True, blank=True)
    address1 = models.CharField(max_length=200, default="")
    address2 = models.CharField(max_length=200, default="")
    city = models.CharField(max_length=200, default="")
    state = models.CharField(max_length=200, default="")
    country = models.CharField(max_length=200, default="")
    zipCode = models.CharField(max_length=200, default="")

    def __str__(self):
        return f"{self.custId.username} - {self.label}" #for python it is the object but for DB it is just Column name
    
#for Ads registration
class Subscriber(models.Model):
    email = models.EmailField(max_length=200, unique=True)

    def __str__(self):
        return self.email


class OTPVerification(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="otp_verifications")
    otp = models.CharField(max_length=6)
    attempts = models.PositiveIntegerField(default=0)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["user", "verified"]),
        ]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    @classmethod
    def default_expiry(cls):
        return timezone.now() + timedelta(minutes=10)


class AuthAuditLog(models.Model):
    ACTION_REGISTER = "register"
    ACTION_LOGIN = "login"
    ACTION_FAILED_LOGIN = "failed_login"
    ACTION_EMAIL_VERIFICATION = "email_verification"
    ACTION_OTP_VERIFICATION = "otp_verification"
    ACTION_CHOICES = (
        (ACTION_REGISTER, "Register"),
        (ACTION_LOGIN, "Login"),
        (ACTION_FAILED_LOGIN, "Failed Login"),
        (ACTION_EMAIL_VERIFICATION, "Email Verification"),
        (ACTION_OTP_VERIFICATION, "OTP Verification"),
    )

    user = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="auth_audit_logs")
    action = models.CharField(max_length=40, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["action", "created_at"]),
        ]

# class CustomerPhoneNo(models.Model):
#     custId = models.ForeignKey(
#         Customer,
#         to_field="username",
#         related_name="phonenos",
#         on_delete=models.CASCADE
#     )
#     phoneno = models.CharField(max_length=20)

#     def __str__(self):
#         return self.custId.username




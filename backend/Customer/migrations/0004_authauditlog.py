# Generated manually for authentication audit logging.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Customer", "0003_customer_pending_otp_otpverification"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuthAuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("register", "Register"),
                            ("login", "Login"),
                            ("failed_login", "Failed Login"),
                            ("email_verification", "Email Verification"),
                            ("otp_verification", "OTP Verification"),
                        ],
                        max_length=40,
                    ),
                ),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="auth_audit_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["user", "created_at"], name="Customer_au_user_id_d35151_idx"),
                    models.Index(fields=["action", "created_at"], name="Customer_au_action_50d4d3_idx"),
                ],
            },
        ),
    ]

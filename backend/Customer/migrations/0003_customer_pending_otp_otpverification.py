# Generated manually for OTP verification.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Customer", "0002_customer_user_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customer",
            name="user_status",
            field=models.CharField(
                choices=[
                    ("pending_verification", "Pending Verification"),
                    ("pending_otp", "Pending OTP"),
                    ("active", "Active"),
                    ("suspended", "Suspended"),
                    ("deleted", "Deleted"),
                ],
                default="pending_verification",
                max_length=30,
            ),
        ),
        migrations.CreateModel(
            name="OTPVerification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("otp", models.CharField(max_length=6)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("verified", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="otp_verifications", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["user", "created_at"], name="Customer_ot_user_id_6a8af8_idx"),
                    models.Index(fields=["user", "verified"], name="Customer_ot_user_id_64d4f2_idx"),
                ],
            },
        ),
    ]

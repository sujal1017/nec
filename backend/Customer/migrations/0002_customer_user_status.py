# Generated manually for email verification account status.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Customer", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="user_status",
            field=models.CharField(
                choices=[
                    ("pending_verification", "Pending Verification"),
                    ("active", "Active"),
                    ("suspended", "Suspended"),
                    ("deleted", "Deleted"),
                ],
                default="pending_verification",
                max_length=30,
            ),
        ),
    ]

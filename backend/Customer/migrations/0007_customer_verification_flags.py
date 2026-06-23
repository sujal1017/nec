from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Customer", "0006_rename_customer_au_user_id_d35151_idx_customer_au_user_id_b165d8_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="customer",
            name="phone_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="customer",
            name="verification_timestamp",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="customer",
            name="phone_verification_timestamp",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

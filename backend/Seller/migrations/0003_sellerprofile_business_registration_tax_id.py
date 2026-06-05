# Generated manually for business registration signup fields.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Seller", "0002_sellerprofile_logo"),
    ]

    operations = [
        migrations.AddField(
            model_name="sellerprofile",
            name="business_registration_number",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="sellerprofile",
            name="tax_id",
            field=models.CharField(blank=True, max_length=80),
        ),
    ]

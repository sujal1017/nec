# Generated manually for marketplace seller profile media support.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Seller", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="sellerprofile",
            name="logo",
            field=models.FileField(blank=True, null=True, upload_to="sellers/logos/"),
        ),
    ]

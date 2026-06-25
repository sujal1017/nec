from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("Product", "0003_search_recent_indexes"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="short_description",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="product",
            name="color",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="product",
            name="size",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="product",
            name="material",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="product",
            name="weight",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="product",
            name="keywords",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="product",
            name="shipping_information",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="product",
            name="return_policy",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.CreateModel(
            name="SellerReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("title", models.CharField(max_length=200)),
                ("comment", models.TextField()),
                ("date", models.DateField()),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="Product.seller")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="seller_reviews", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

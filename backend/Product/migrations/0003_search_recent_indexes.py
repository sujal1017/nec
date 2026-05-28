from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("Product", "0002_marketplace_media_and_landing"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SearchTerm",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("query", models.CharField(max_length=255, unique=True)),
                ("normalized_query", models.CharField(max_length=255, unique=True)),
                ("count", models.PositiveIntegerField(default=1)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-count", "-updated_at"]},
        ),
        migrations.CreateModel(
            name="SearchHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("query", models.CharField(db_index=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="search_history", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "unique_together": {("user", "query")}},
        ),
        migrations.CreateModel(
            name="RecentlyViewedProduct",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("viewed_at", models.DateTimeField(auto_now=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recent_views", to="Product.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recently_viewed_products", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-viewed_at"], "unique_together": {("user", "product")}},
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "name"], name="Product_pro_status_140850_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "price"], name="Product_pro_status_d3f4c3_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "rating"], name="Product_pro_status_c3099e_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "created_at"], name="Product_pro_status_e709b2_idx"),
        ),
        migrations.AddIndex(
            model_name="recentlyviewedproduct",
            index=models.Index(fields=["user", "-viewed_at"], name="Product_rec_user_id_7349e7_idx"),
        ),
    ]

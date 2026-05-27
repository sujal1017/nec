# Generated manually for marketplace media/upload support.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Product", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="categories/"),
        ),
        migrations.AddField(
            model_name="category",
            name="slug",
            field=models.SlugField(blank=True, db_index=True, max_length=120),
        ),
        migrations.AddField(
            model_name="product",
            name="thumbnail",
            field=models.FileField(blank=True, null=True, upload_to="products/thumbnails/"),
        ),
        migrations.AddField(
            model_name="productimage",
            name="image_url",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="products/"),
        ),
        migrations.AddField(
            model_name="banner",
            name="cta_label",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="banner",
            name="cta_url",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name="banner",
            name="description",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="banner",
            name="image_url",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="banner",
            name="title",
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AlterField(
            model_name="banner",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="banners/"),
        ),
    ]

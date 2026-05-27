import django.db.models.deletion
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("Orders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrderTrackingEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("ORDER_PLACED", "Order Placed"), ("PACKED", "Packed"), ("SHIPPED", "Shipped"), ("OUT_FOR_DELIVERY", "Out For Delivery"), ("DELIVERED", "Delivered")], max_length=30)),
                ("timestamp", models.DateTimeField(default=django.utils.timezone.now)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tracking_events", to="Orders.order")),
            ],
            options={"ordering": ["timestamp"], "unique_together": {("order", "status")}},
        ),
    ]

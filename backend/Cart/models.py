from django.db import models
from Customer.models import Customer

class Cart(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="carts")
    name = models.CharField(max_length=100, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "name")

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    image = models.CharField(max_length=500, blank=True, null=True)  # Can be a URL or local string
    selected_options = models.JSONField(default=dict, blank=True)

    # added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product_id")

    def __str__(self):
        return f"{self.name} (x{self.quantity})"

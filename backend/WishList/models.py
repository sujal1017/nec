from django.db import models
from django.conf import settings  # ✅ use this instead of django.contrib.auth.models
from django.utils import timezone

# class Wishlist(models.Model):
#     # ✅ Link to your custom user model (Customer.Customer)
#     user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlists')

from django.conf import settings  # <- import this

class Wishlist(models.Model):

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,  related_name='wishlists')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.TextField(default="")  # can store URLs or local paths
    selected_options = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} in {self.wishlist.name}"

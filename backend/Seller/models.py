from django.conf import settings
from django.db import models


class SellerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profile",
    )
    business_name = models.CharField(max_length=180)
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=20, blank=True)
    business_address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=30, blank=True)
    profile_image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["business_name"]),
            models.Index(fields=["business_email"]),
        ]

    def __str__(self):
        return self.business_name

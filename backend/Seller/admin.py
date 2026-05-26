from django.contrib import admin

from .models import SellerProfile


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("business_name", "business_email", "user", "created_at")
    search_fields = ("business_name", "business_email", "user__email", "gst_number")
    readonly_fields = ("created_at",)

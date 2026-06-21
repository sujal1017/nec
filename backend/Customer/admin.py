from django.contrib import admin
from .models import Customer, CustomerAddress, Subscriber, OTPVerification, AuthAuditLog

# Register your models here.
admin.site.register(Customer)
admin.site.register(CustomerAddress)
admin.site.register(Subscriber)

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "otp", "attempts", "verified", "created_at", "expires_at")
    list_filter = ("verified", "created_at")
    search_fields = ("user__email", "user__username")
    readonly_fields = ("created_at", "expires_at")

@admin.register(AuthAuditLog)
class AuthAuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "ip_address", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("user__email", "user__username", "action")
    readonly_fields = ("created_at",)

# admin.site.register(models.CustomerPhoneNo)
from django.contrib import admin
from .models import Customer, CustomerAddress, Subscriber

# Register your models here.
admin.site.register(Customer)
admin.site.register(CustomerAddress)
admin.site.register(Subscriber)
# admin.site.register(models.CustomerPhoneNo)
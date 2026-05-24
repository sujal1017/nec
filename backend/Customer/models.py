from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField


class Customer(AbstractUser):
    ACCOUNT_TYPE_CHOICES = (
        ("personal", "Personal"),
        ("business", "Business"),
    )
    # already has:
    # username, first_name, last_name
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)  # important ✅
    phoneno = PhoneNumberField(blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default="personal")
    business_name = models.CharField(max_length=150, blank=True, default="")

    def __str__(self):
        return f"{self.username} ({self.first_name} {self.last_name})"
    
class CustomerAddress(models.Model):
    custId = models.ForeignKey(
        Customer,
        to_field="username",
        on_delete=models.CASCADE,
        related_name="addresses" #must be unique in Customer
    )
    label = models.CharField(max_length=200, null=True, blank=True)
    address1 = models.CharField(max_length=200, default="")
    address2 = models.CharField(max_length=200, default="")
    city = models.CharField(max_length=200, default="")
    state = models.CharField(max_length=200, default="")
    country = models.CharField(max_length=200, default="")
    zipCode = models.CharField(max_length=200, default="")

    def __str__(self):
        return f"{self.custId.username} - {self.label}" #for python it is the object but for DB it is just Column name
    
#for Ads registration
class Subscriber(models.Model):
    email = models.EmailField(max_length=200, unique=True)

    def __str__(self):
        return self.email

# class CustomerPhoneNo(models.Model):
#     custId = models.ForeignKey(
#         Customer,
#         to_field="username",
#         related_name="phonenos",
#         on_delete=models.CASCADE
#     )
#     phoneno = models.CharField(max_length=20)

#     def __str__(self):
#         return self.custId.username

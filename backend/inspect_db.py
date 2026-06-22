import os, sys
sys.path.insert(0, r'C:\Users\hp\OneDrive\Desktop\E-comm_team_1\backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'EcommerceProject.settings'
import django; django.setup()
from Customer.models import Customer
from Product.models import Product
from Seller.models import SellerProfile

print("=== USERS ===")
for u in Customer.objects.all():
    print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}, Staff: {u.is_staff}, Superuser: {u.is_superuser}, Type: {u.account_type}, Keycloak ID: {u.keycloak_user_id}")

print("=== PRODUCTS ===")
print("Total products:", Product.objects.count())

print("=== SELLER PROFILES ===")
for p in SellerProfile.objects.all():
    print(f"ID: {p.id}, Business Name: {p.business_name}, User: {p.user.username}")

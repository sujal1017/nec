from django.contrib import admin
from .models import Category, Product,OptionValue, ProductOption, Seller, Brand, ProductImage, Review, FAQ, Banner, CustomerSupport

# Register your models here.
admin.site.register(Category)
admin.site.register(ProductImage)
admin.site.register(Product)
admin.site.register(OptionValue)
admin.site.register(ProductOption)
admin.site.register(Seller)
admin.site.register(Brand)
admin.site.register(Review)
admin.site.register(FAQ)
admin.site.register(Banner)
admin.site.register(CustomerSupport)

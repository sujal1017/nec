from django.contrib import admin
from .models import Order, Payment,BidHistory,AuctionProduct,OrderItem

admin.site.register(Order)
admin.site.register(BidHistory)
admin.site.register(OrderItem)
admin.site.register(AuctionProduct)
from django.urls import path
from . import views

urlpatterns = [
    path("create-order/", views.create_order_from_cart),
    path("payments/create/", views.create_payment),
    path("my-orders/", views.user_orders),
    path("<int:order_id>/tracking/", views.order_tracking),
    path("auctions/<int:auction_id>/", views.auction_details),
    path("auctions/<int:auction_id>/bid/", views.place_bid),
    path("auctions/my-bids/", views.my_bids),
]

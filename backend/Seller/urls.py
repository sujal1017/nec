from django.urls import path

from .views import (
    SellerDashboardView,
    SellerOrderListView,
    SellerProductDetailView,
    SellerProductListCreateView,
    SellerProfileView,
)

urlpatterns = [
    path("dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("products/", SellerProductListCreateView.as_view(), name="seller-products"),
    path("products/<int:pk>/", SellerProductDetailView.as_view(), name="seller-product-detail"),
    path("orders/", SellerOrderListView.as_view(), name="seller-orders"),
]

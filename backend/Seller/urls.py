from django.urls import path

from .views import (
    SellerDashboardView,
    SellerOrderListView,
    SellerProductDetailView,
    SellerProductListCreateView,
)

urlpatterns = [
    path("dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("products/", SellerProductListCreateView.as_view(), name="seller-products"),
    path("products/<int:pk>/", SellerProductDetailView.as_view(), name="seller-product-detail"),
    path("orders/", SellerOrderListView.as_view(), name="seller-orders"),
]

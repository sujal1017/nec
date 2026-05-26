from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from Orders.models import Order, OrderItem
from Product.models import Product

from .models import SellerProfile
from .pagination import SellerPageNumberPagination
from .permissions import IsBusinessSeller
from .serializers import SellerOrderSerializer, SellerProductSerializer


def get_seller_profile(user):
    try:
        return user.seller_profile
    except SellerProfile.DoesNotExist:
        business_name = getattr(user, "business_name", "") or getattr(user, "name", "") or user.email
        return SellerProfile.objects.create(
            user=user,
            business_name=business_name,
            business_email=user.email,
            business_phone=str(getattr(user, "phoneno", "") or ""),
        )


class SellerDashboardView(APIView):
    permission_classes = [IsBusinessSeller]

    def get(self, request):
        seller_profile = get_seller_profile(request.user)
        products = Product.objects.filter(seller_profile=seller_profile)
        seller_items = OrderItem.objects.filter(seller=seller_profile).select_related("order")
        line_total = ExpressionWrapper(F("price") * F("quantity"), output_field=DecimalField(max_digits=12, decimal_places=2))

        total_revenue = seller_items.exclude(order__status="CANCELLED").aggregate(
            value=Coalesce(Sum(line_total), 0, output_field=DecimalField(max_digits=12, decimal_places=2))
        )["value"]

        order_ids = seller_items.values("order_id").distinct()
        recent_orders = (
            Order.objects.filter(id__in=order_ids)
            .select_related("user")
            .prefetch_related("items")
            .order_by("-created_at")[:8]
        )

        top_products = (
            seller_items.values("product_id", "name")
            .annotate(quantity_sold=Coalesce(Sum("quantity"), 0), revenue=Coalesce(Sum(line_total), 0, output_field=DecimalField(max_digits=12, decimal_places=2)))
            .order_by("-quantity_sold", "-revenue")[:5]
        )

        low_stock_products = products.filter(stock__lte=5).order_by("stock", "name")[:8]

        data = {
            "seller": {
                "id": seller_profile.id,
                "business_name": seller_profile.business_name,
                "business_email": seller_profile.business_email,
                "profile_image": seller_profile.profile_image,
            },
            "metrics": {
                "total_products": products.count(),
                "total_orders": order_ids.count(),
                "pending_orders": seller_items.filter(order__status__in=["PENDING", "PROCESSING"]).values("order_id").distinct().count(),
                "total_revenue": total_revenue,
                "low_stock_products": products.filter(stock__lte=5).count(),
            },
            "recent_orders": SellerOrderSerializer(recent_orders, many=True, context={"seller_profile": seller_profile}).data,
            "top_selling_products": list(top_products),
            "low_stock_items": SellerProductSerializer(low_stock_products, many=True).data,
        }
        return Response(data)


class SellerProductListCreateView(generics.ListCreateAPIView):
    serializer_class = SellerProductSerializer
    permission_classes = [IsBusinessSeller]
    pagination_class = SellerPageNumberPagination

    def get_queryset(self):
        seller_profile = get_seller_profile(self.request.user)
        queryset = Product.objects.filter(seller_profile=seller_profile).select_related("category", "brand").prefetch_related("images")
        search = self.request.query_params.get("search")
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        low_stock = self.request.query_params.get("low_stock")

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(sku__icontains=search))
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category:
            queryset = queryset.filter(category__name__iexact=category)
        if str(low_stock).lower() == "true":
            queryset = queryset.filter(stock__lte=5)
        return queryset.order_by("-created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["seller_profile"] = get_seller_profile(self.request.user)
        return context


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SellerProductSerializer
    permission_classes = [IsBusinessSeller]

    def get_queryset(self):
        seller_profile = get_seller_profile(self.request.user)
        return Product.objects.filter(seller_profile=seller_profile).select_related("category", "brand").prefetch_related("images")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["seller_profile"] = get_seller_profile(self.request.user)
        return context


class SellerOrderListView(generics.ListAPIView):
    serializer_class = SellerOrderSerializer
    permission_classes = [IsBusinessSeller]
    pagination_class = SellerPageNumberPagination

    def get_queryset(self):
        seller_profile = get_seller_profile(self.request.user)
        order_ids = OrderItem.objects.filter(seller=seller_profile).values("order_id").distinct()
        queryset = Order.objects.filter(id__in=order_ids).select_related("user").prefetch_related("items").order_by("-created_at")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["seller_profile"] = get_seller_profile(self.request.user)
        return context

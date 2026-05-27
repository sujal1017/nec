from .serializers import ProductRetrieveSerializer, BannerSerializer, ProductListSerializer, CategorySerializer
from .models import Product, Banner, Category
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import permissions, authentication
from django.db.models import Q
import functools
import operator
from rest_framework import viewsets
from rest_framework.views import APIView

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        products = Product.objects.filter(status=Product.STATUS_ACTIVE).select_related('category', 'brand').prefetch_related('images', 'options__option')
        category = self.request.query_params.get("category")
        in_stock = self.request.query_params.get("in_stock")
        brand = self.request.query_params.get("brand")
        rating = self.request.query_params.get("rating")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        search = self.request.query_params.get("search")

        if category:
            products = products.filter(category__name__in=category.split(','))

        if search:
            products = products.filter(Q(name__icontains=search) | Q(description__icontains=search) | Q(brand__name__icontains=search))

        if in_stock:
            if in_stock.lower() == 'true':
                products = products.filter(stock__gt=0)
            elif in_stock.lower() == 'false':
                products = products.filter(stock=0)

        if brand:
            products = products.filter(brand__name__in=brand.split(','))

        if rating:
            try:
                rating_value = float(rating)
                products = products.filter(rating__gte=rating_value)
            except ValueError:
                pass

        if min_price:
            try:
                min_price_value = float(min_price)
                products = products.filter(price__gte=min_price_value)
            except ValueError:
                pass

        if max_price:
            try:
                max_price_value = float(max_price)
                products = products.filter(price__lte=max_price_value)
            except ValueError:
                pass

        flag = False
        for key, value in self.request.query_params.items():
            if key.startswith('option_'):
                flag = True
                option_name = key.replace('option_', '')
                option_values = value.split(',')
                value_queries = [Q(options__value__iexact=v) for v in option_values]
                if value_queries:
                    combined_value_query = functools.reduce(operator.or_, value_queries)
                products = products.filter(Q(options__option__name__iexact=option_name) & combined_value_query)

        if flag:
            return products.distinct() 
        return products
    
    
class ProductRetrieveView(generics.RetrieveAPIView):
    serializer_class = ProductRetrieveSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.all().select_related('category', 'brand', 'seller', 'auction').prefetch_related('reviews', 'faqs', 'images', 'options__option')


class BannersListView(generics.ListAPIView):
    serializer_class = BannerSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = Banner.objects.all()

    def list(self, request, *args, **kwargs):
        banners = super().list(request, *args, **kwargs).data
        data = {
            'banners': banners
        }

        return Response(data)


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.all().order_by("name")


class LandingContentView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = (
            Product.objects.filter(status=Product.STATUS_ACTIVE)
            .select_related("category", "brand")
            .prefetch_related("images")
            .order_by("-created_at")
        )
        featured = products.filter(is_featured=True)[:12]
        trending = products.filter(stock__gt=0).order_by("-rating", "-created_at")[:12]
        recommended = products.filter(stock__gt=0)[4:16]

        return Response(
            {
                "banners": BannerSerializer(Banner.objects.all().order_by("-id")[:6], many=True, context={"request": request}).data,
                "categories": CategorySerializer(Category.objects.all().order_by("name")[:16], many=True, context={"request": request}).data,
                "featuredProducts": ProductListSerializer(featured, many=True, context={"request": request}).data,
                "trendingProducts": ProductListSerializer(trending, many=True, context={"request": request}).data,
                "recommendedProducts": ProductListSerializer(recommended, many=True, context={"request": request}).data,
                "deals": ProductListSerializer(products.exclude(discount_price__isnull=True).order_by("-created_at")[:8], many=True, context={"request": request}).data,
            }
        )
    

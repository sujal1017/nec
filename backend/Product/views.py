from .serializers import ProductRetrieveSerializer, BannerSerializer, ProductListSerializer, CategorySerializer, SearchSuggestionSerializer, SellerProfileSerializer
from .models import Product, Banner, Category, Brand, SearchHistory, SearchTerm, RecentlyViewedProduct, Seller
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import permissions, authentication
from django.db.models import Q, Count, Case, When, IntegerField
import functools
import operator
from rest_framework import viewsets
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .search_utils import apply_smart_filters, get_typo_suggestion, normalize_query, parse_smart_query

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        products = Product.objects.filter(status=Product.STATUS_ACTIVE).select_related('category', 'brand', 'seller').prefetch_related('images', 'options__option', 'reviews')
        category = self.request.query_params.get("category")
        in_stock = self.request.query_params.get("in_stock")
        brand = self.request.query_params.get("brand")
        rating = self.request.query_params.get("rating")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        search = self.request.query_params.get("search")
        condition = self.request.query_params.get("condition")
        location = self.request.query_params.get("location")
        smart = self.request.query_params.get("smart")

        if category:
            products = products.filter(category__name__in=category.split(','))

        if search and str(smart).lower() == "true":
            products = apply_smart_filters(products, parse_smart_query(search))
        elif search:
            products = products.filter(Q(name__icontains=search) | Q(description__icontains=search) | Q(short_description__icontains=search) | Q(keywords__icontains=search) | Q(category__name__icontains=search) | Q(brand__name__icontains=search))

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

        if condition:
            products = products.filter(options__option__name__iexact="condition", options__value__in=condition.split(","))

        if location:
            products = products.filter(seller__location__in=location.split(","))

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
        return Product.objects.all().select_related('category', 'brand', 'seller', 'auction').prefetch_related('reviews__user', 'faqs', 'images', 'options__option', 'seller__reviews__user')


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
            .select_related("category", "brand", "seller")
            .prefetch_related("images", "reviews")
            .order_by("-created_at")
        )
        featured = products.filter(is_featured=True)[:20]
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


class SearchSuggestionView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = normalize_query(request.query_params.get("q", ""))
        if not query:
            return Response({"suggestions": [], "didYouMean": None})

        products = (
            Product.objects.filter(status=Product.STATUS_ACTIVE)
            .select_related("category", "brand")
            .prefetch_related("images")
            .annotate(
                rank=Case(
                    When(name__istartswith=query, then=0),
                    When(brand__name__istartswith=query, then=1),
                    When(category__name__istartswith=query, then=2),
                    default=3,
                    output_field=IntegerField(),
                )
            )
            .filter(Q(name__icontains=query) | Q(brand__name__icontains=query) | Q(category__name__icontains=query) | Q(keywords__icontains=query) | Q(description__icontains=query) | Q(short_description__icontains=query))
            .order_by("rank", "-rating", "name")[:10]
        )
        return Response({
            "suggestions": SearchSuggestionSerializer(products, many=True, context={"request": request}).data,
            "didYouMean": get_typo_suggestion(query),
        })


class SearchMetaView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = Product.objects.filter(status=Product.STATUS_ACTIVE).select_related("category", "brand", "seller").prefetch_related("options__option")
        return Response({
            "brands": sorted(set(products.exclude(brand__isnull=True).values_list("brand__name", flat=True))),
            "categories": sorted(set(products.exclude(category__isnull=True).values_list("category__name", flat=True))),
            "locations": sorted(set(products.exclude(seller__location__isnull=True).exclude(seller__location="").values_list("seller__location", flat=True))),
            "conditions": sorted(set(
                products.filter(options__option__name__iexact="condition").values_list("options__value", flat=True)
            ) or {"New"}),
        })


class TrendingSearchView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        terms = list(SearchTerm.objects.order_by("-count", "-updated_at").values_list("query", flat=True)[:8])
        if len(terms) < 8:
            product_terms = Product.objects.filter(status=Product.STATUS_ACTIVE).order_by("-rating").values_list("brand__name", flat=True)[:8]
            terms.extend([term for term in product_terms if term and term not in terms])
        return Response({"terms": terms[:8]})


class SearchHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"history": []})
        history = SearchHistory.objects.filter(user=request.user).values_list("query", flat=True)[:10]
        return Response({"history": list(history)})

    def post(self, request):
        query = normalize_query(request.data.get("query", ""))
        if not query:
            return Response({"history": []})
        term, created = SearchTerm.objects.get_or_create(normalized_query=query, defaults={"query": request.data.get("query", query)})
        if not created:
            term.count += 1
            term.query = request.data.get("query", term.query)
            term.save(update_fields=["count", "query", "updated_at"])
        if request.user.is_authenticated:
            item, _ = SearchHistory.objects.update_or_create(user=request.user, query=query)
            stale = SearchHistory.objects.filter(user=request.user).order_by("-created_at")[10:]
            SearchHistory.objects.filter(pk__in=[item.pk for item in stale]).delete()
        return self.get(request)


class RecentlyViewedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ids = request.query_params.get("ids")
        if request.user.is_authenticated:
            product_ids = list(RecentlyViewedProduct.objects.filter(user=request.user).values_list("product_id", flat=True)[:10])
        else:
            product_ids = [int(pk) for pk in (ids or "").split(",") if pk.isdigit()][:10]

        preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(product_ids)], output_field=IntegerField())
        products = Product.objects.filter(pk__in=product_ids, status=Product.STATUS_ACTIVE).select_related("category", "brand", "seller").prefetch_related("images", "reviews").order_by(preserved)
        return Response({"products": ProductListSerializer(products, many=True, context={"request": request}).data})

    def post(self, request):
        product = get_object_or_404(Product, pk=request.data.get("product_id"), status=Product.STATUS_ACTIVE)
        if request.user.is_authenticated:
            RecentlyViewedProduct.objects.update_or_create(user=request.user, product=product)
            stale = RecentlyViewedProduct.objects.filter(user=request.user).order_by("-viewed_at")[10:]
            RecentlyViewedProduct.objects.filter(pk__in=[item.pk for item in stale]).delete()
        return Response({"ok": True, "viewed_at": timezone.now()})


class ProductRecommendationView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk, status=Product.STATUS_ACTIVE)
        serializer = ProductRetrieveSerializer(product, context={"request": request})
        return Response({
            "relatedProducts": serializer.data.get("related_products", []),
            "similarProducts": serializer.data.get("similar_products", []),
            "frequentlyBoughtTogether": serializer.data.get("frequently_bought_together", []),
        })


class SellerProfileView(generics.RetrieveAPIView):
    serializer_class = SellerProfileSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Seller.objects.all().select_related("customer_support").prefetch_related("products__images", "reviews__user")


class ProductCompareView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ids = [int(pk) for pk in request.query_params.get("ids", "").split(",") if pk.isdigit()][:4]
        preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)], output_field=IntegerField())
        products = Product.objects.filter(pk__in=ids, status=Product.STATUS_ACTIVE).select_related("category", "brand", "seller").prefetch_related("images", "options__option").order_by(preserved)
        return Response({"products": ProductRetrieveSerializer(products, many=True, context={"request": request}).data})
    

from .models import Seller, Product, Review, FAQ, Banner, CustomerSupport, Category
from rest_framework import serializers
from collections import defaultdict
from django.db import models
from Orders.models import AuctionProduct, BidHistory
from Orders.serializers import AuctionProductSerializer


def media_or_legacy_url(file_field, request=None):
    if not file_field:
        return None
    name = str(getattr(file_field, "name", "") or "")
    if name.startswith(("http://", "https://")):
        return name
    try:
        url = file_field.url
    except ValueError:
        return None
    return request.build_absolute_uri(url) if request else url

class CustomerSupportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerSupport
        exclude = ['seller', 'id']

class SellerSerializer(serializers.ModelSerializer):
    customer_support = CustomerSupportSerializer(read_only=True)
    
    class Meta:
        model = Seller
        fields = ['id', 'name', 'rating', 'total_sales', 'joined_date', 'verified', 'description', 'business_hours', 'shipping_time', 'return_policy', 'warranty', 'location', 'badges', 'customer_support']

class ReviewSerializer(serializers.ModelSerializer):
    verified = serializers.BooleanField(source='user.is_verified')

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'date', 'title', 'comment', 'verified']

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['question', 'answer']


class ProductRetrieveSerializer(serializers.ModelSerializer):
    seller = SellerSerializer(read_only=True)
    category = serializers.StringRelatedField()
    brand = serializers.StringRelatedField()
    reviews = ReviewSerializer(many=True, read_only=True)
    faqs = FAQSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()
    frequently_bought_together = serializers.SerializerMethodField()
    auction= AuctionProductSerializer(read_only=True)
    is_auction = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'brand', 'description', 'image', 'images', 'price', 'rating', 'in_stock', 'seller', 'features', 'reviews', 'faqs', 'is_auction', 'auction','options',  'related_products', 'similar_products', 'frequently_bought_together']

    def get_image(self, obj):
        request = self.context.get("request")
        thumbnail = media_or_legacy_url(obj.thumbnail, request)
        if thumbnail:
            return thumbnail
        if obj.image:
            return obj.image
        for img in obj.images.all():
            if img.is_main:
                image = media_or_legacy_url(img.image, request)
                if image:
                    return image
                return img.image_url
        return None
    
    def get_images(self, obj):
        images = defaultdict(list)
        for img in obj.images.all():
            if img.option:
                value = img.option.value
                if value:
                    images[value].append(self._image_value(img))
            else:
                images["default"].append(self._image_value(img))
        return images

    def _image_value(self, img):
        request = self.context.get("request")
        return media_or_legacy_url(img.image, request) or img.image_url
    
    def get_options(self, obj):
        options_dict = defaultdict(list)
        for option_value in obj.options.all():
            options_dict[option_value.option.name].append(option_value.value)
        return options_dict

    def get_is_auction(self, obj):
        return hasattr(obj, 'auction')
    
    def get_related_products(self, obj):
        related = Product.objects.filter(
            status=Product.STATUS_ACTIVE,
            category=obj.category,
            stock__gt=0,
        ).exclude(pk=obj.pk).select_related("category", "brand").prefetch_related("images")[:6]
        serializer = ProductListSerializer(related, many=True, context=self.context)
    
        return serializer.data

    def get_similar_products(self, obj):
        similar = (
            Product.objects.filter(status=Product.STATUS_ACTIVE, stock__gt=0)
            .exclude(pk=obj.pk)
            .select_related("category", "brand")
            .prefetch_related("images")
        )
        lower = obj.price * 0.75
        upper = obj.price * 1.25
        similar = similar.filter(
            models.Q(category=obj.category)
            | models.Q(brand=obj.brand)
            | models.Q(price__gte=lower, price__lte=upper)
        ).distinct()[:6]
        return ProductListSerializer(similar, many=True, context=self.context).data

    def get_frequently_bought_together(self, obj):
        from django.db.models import Count
        from Orders.models import OrderItem

        order_ids = OrderItem.objects.filter(product=obj).values_list("order_id", flat=True)
        product_ids = (
            OrderItem.objects.filter(order_id__in=order_ids)
            .exclude(product=obj)
            .exclude(product__isnull=True)
            .values("product")
            .annotate(score=Count("id"))
            .order_by("-score")
            .values_list("product", flat=True)[:3]
        )
        products = Product.objects.filter(pk__in=list(product_ids), status=Product.STATUS_ACTIVE).select_related("category", "brand").prefetch_related("images")
        return ProductListSerializer(products, many=True, context=self.context).data
    
class ProductListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    brand = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    condition = serializers.SerializerMethodField()
    location = serializers.CharField(source="seller.location", read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'discount_price', 'image', 'brand', 'category', 'rating', 'auction', 'in_stock', 'condition', 'location', 'features', 'description']

    def get_image(self, obj):
        request = self.context.get("request")
        thumbnail = media_or_legacy_url(obj.thumbnail, request)
        if thumbnail:
            return thumbnail
        if obj.image:
            return obj.image
        for img in obj.images.all():
            if img.is_main:
                image = media_or_legacy_url(img.image, request)
                if image:
                    return image
                return img.image_url
        return None

    def get_condition(self, obj):
        for option in obj.options.all():
            if option.option.name.lower() == "condition":
                return option.value
        return "New"


class SearchSuggestionSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    brand = serializers.StringRelatedField()
    category = serializers.StringRelatedField()

    class Meta:
        model = Product
        fields = ["id", "name", "image", "brand", "category", "price"]

    def get_image(self, obj):
        return ProductListSerializer(obj, context=self.context).data.get("image")

class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = '__all__'

    def get_image(self, obj):
        request = self.context.get("request")
        return media_or_legacy_url(obj.image, request) or obj.image_url


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image"]

    def get_image(self, obj):
        request = self.context.get("request")
        image = media_or_legacy_url(obj.image, request)
        if image:
            return image
        first_product = obj.products.filter(stock__gt=0).prefetch_related("images").first()
        if not first_product:
            return None
        return ProductListSerializer(first_product, context=self.context).data.get("image")


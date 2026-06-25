from decimal import Decimal
from .models import Seller, Product, Review, FAQ, Banner, CustomerSupport, Category, SellerReview
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
    total_reviews = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    address = serializers.CharField(source="location", read_only=True)
    profile_image = serializers.SerializerMethodField()
    banner_image = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()
    
    class Meta:
        model = Seller
        fields = ['id', 'name', 'shop_name', 'email', 'phone', 'address', 'profile_image', 'banner_image', 'followers', 'rating', 'total_reviews', 'total_products', 'total_sales', 'joined_date', 'verified', 'description', 'business_hours', 'shipping_time', 'return_policy', 'warranty', 'location', 'badges', 'customer_support']

    def _badge_value(self, obj, key, default=""):
        if isinstance(obj.badges, dict):
            return obj.badges.get(key, default)
        return default

    def get_shop_name(self, obj):
        return self._badge_value(obj, "shop_name", obj.name)

    def get_email(self, obj):
        support = getattr(obj, "customer_support", None)
        return self._badge_value(obj, "email", getattr(support, "email", ""))

    def get_phone(self, obj):
        support = getattr(obj, "customer_support", None)
        return self._badge_value(obj, "phone", getattr(support, "phone", ""))

    def get_profile_image(self, obj):
        return self._badge_value(obj, "profile_image", "")

    def get_banner_image(self, obj):
        return self._badge_value(obj, "banner_image", "")

    def get_followers(self, obj):
        return self._badge_value(obj, "followers", 0)

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_total_products(self, obj):
        return obj.products.filter(status=Product.STATUS_ACTIVE).count()

class ReviewSerializer(serializers.ModelSerializer):
    verified = serializers.BooleanField(source='user.is_verified')
    customer_name = serializers.SerializerMethodField()
    customer_profile_image = serializers.CharField(source="user.avatar", read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'customer_name', 'customer_profile_image', 'rating', 'date', 'title', 'comment', 'verified']

    def get_customer_name(self, obj):
        return obj.user.name or obj.user.get_full_name() or obj.user.username


class SellerReviewSerializer(serializers.ModelSerializer):
    verified = serializers.BooleanField(source='user.is_verified')
    customer_name = serializers.SerializerMethodField()
    customer_profile_image = serializers.CharField(source="user.avatar", read_only=True)

    class Meta:
        model = SellerReview
        fields = ['id', 'username', 'customer_name', 'customer_profile_image', 'rating', 'date', 'title', 'comment', 'verified']

    def get_customer_name(self, obj):
        return obj.user.name or obj.user.get_full_name() or obj.user.username

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
    discount = serializers.SerializerMethodField()
    number_of_reviews = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    specifications = serializers.SerializerMethodField()
    more_from_seller = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()
    frequently_bought_together = serializers.SerializerMethodField()
    auction= AuctionProductSerializer(read_only=True)
    is_auction = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'category', 'brand', 'short_description', 'description', 'image', 'images', 'price', 'discount', 'discount_price', 'rating', 'number_of_reviews', 'stock_quantity', 'in_stock', 'seller', 'sku', 'color', 'size', 'material', 'weight', 'shipping_information', 'return_policy', 'features', 'specifications', 'reviews', 'faqs', 'is_auction', 'auction','options', 'more_from_seller', 'related_products', 'similar_products', 'frequently_bought_together']

    def get_discount(self, obj):
        if not obj.discount_price or obj.price <= 0 or obj.discount_price >= obj.price:
            return 0
        return round(((obj.price - obj.discount_price) / obj.price) * 100)

    def get_number_of_reviews(self, obj):
        return obj.reviews.count()

    def get_image(self, obj):
        request = self.context.get("request")
        thumbnail = media_or_legacy_url(obj.thumbnail, request)
        if thumbnail:
            return thumbnail
        if obj.image:
            return media_or_legacy_url(obj.image, request)
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
        if obj.size and "Size" not in options_dict:
            options_dict["Size"] = [value.strip() for value in obj.size.split(",") if value.strip()]
        if obj.color and "Color" not in options_dict:
            options_dict["Color"] = [value.strip() for value in obj.color.split(",") if value.strip()]
        return options_dict

    def get_specifications(self, obj):
        return {
            "SKU": obj.sku,
            "Brand": str(obj.brand) if obj.brand else "",
            "Category": str(obj.category) if obj.category else "",
            "Color": obj.color,
            "Size": obj.size,
            "Material": obj.material,
            "Weight": obj.weight,
        }

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
        lower = obj.price * Decimal("0.75")
        upper = obj.price * Decimal("1.25")

        similar = (
            Product.objects.filter(
                status=Product.STATUS_ACTIVE,
                stock__gt=0,
            )
            .exclude(pk=obj.pk)
            .filter(
                models.Q(category=obj.category)
                | models.Q(brand=obj.brand)
                | models.Q(price__range=(lower, upper))
            )
            .select_related("category", "brand", "seller")
            .prefetch_related("images")
            .distinct()[:6]
        )

        return ProductListSerializer(
            similar,
            many=True,
            context=self.context,
        ).data

    def get_more_from_seller(self, obj):
        products = (
            Product.objects.filter(status=Product.STATUS_ACTIVE, seller=obj.seller, stock__gt=0)
            .exclude(pk=obj.pk)
            .select_related("category", "brand", "seller")
            .prefetch_related("images")[:6]
        )
        return ProductListSerializer(products, many=True, context=self.context).data

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
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)
    seller_name = serializers.CharField(source="seller.name", read_only=True)
    discount = serializers.SerializerMethodField()
    number_of_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'discount_price', 'discount', 'image', 'brand', 'category', 'rating', 'number_of_reviews', 'seller_id', 'seller_name', 'auction', 'in_stock', 'condition', 'location', 'features', 'short_description', 'description']

    def get_discount(self, obj):
        if not obj.discount_price or obj.price <= 0 or obj.discount_price >= obj.price:
            return 0
        return round(((obj.price - obj.discount_price) / obj.price) * 100)

    def get_number_of_reviews(self, obj):
        return obj.reviews.count()

    def get_image(self, obj):
        request = self.context.get("request")
        thumbnail = media_or_legacy_url(obj.thumbnail, request)
        if thumbnail:
            return thumbnail
        if obj.image:
            return media_or_legacy_url(obj.image, request)
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
    seller_name = serializers.CharField(source="seller.name", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "image", "brand", "category", "seller_name", "price"]

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


class SellerProfileSerializer(serializers.ModelSerializer):
    customer_support = CustomerSupportSerializer(read_only=True)
    products = serializers.SerializerMethodField()
    reviews = SellerReviewSerializer(many=True, read_only=True)
    total_reviews = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    rating_distribution = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    address = serializers.CharField(source="location", read_only=True)
    profile_image = serializers.SerializerMethodField()
    banner_image = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = ['id', 'name', 'shop_name', 'email', 'phone', 'address', 'profile_image', 'banner_image', 'followers', 'rating', 'total_reviews', 'rating_distribution', 'total_products', 'total_sales', 'joined_date', 'verified', 'description', 'business_hours', 'shipping_time', 'return_policy', 'warranty', 'location', 'badges', 'customer_support', 'products', 'reviews']

    def _badge_value(self, obj, key, default=""):
        if isinstance(obj.badges, dict):
            return obj.badges.get(key, default)
        return default

    def get_shop_name(self, obj):
        return self._badge_value(obj, "shop_name", obj.name)

    def get_email(self, obj):
        support = getattr(obj, "customer_support", None)
        return self._badge_value(obj, "email", getattr(support, "email", ""))

    def get_phone(self, obj):
        support = getattr(obj, "customer_support", None)
        return self._badge_value(obj, "phone", getattr(support, "phone", ""))

    def get_profile_image(self, obj):
        return self._badge_value(obj, "profile_image", "")

    def get_banner_image(self, obj):
        return self._badge_value(obj, "banner_image", "")

    def get_followers(self, obj):
        return self._badge_value(obj, "followers", 0)

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def get_total_products(self, obj):
        return obj.products.filter(status=Product.STATUS_ACTIVE).count()

    def get_products(self, obj):
        products = obj.products.filter(status=Product.STATUS_ACTIVE).select_related("category", "brand", "seller").prefetch_related("images")
        return ProductListSerializer(products, many=True, context=self.context).data

    def get_rating_distribution(self, obj):
        counts = obj.reviews.values("rating").annotate(total=models.Count("id"))
        result = {str(star): 0 for star in range(1, 6)}
        for row in counts:
            result[str(row["rating"])] = row["total"]
        return result


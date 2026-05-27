from .models import Seller, Product, Review, FAQ, Banner, CustomerSupport, Category
from rest_framework import serializers
from collections import defaultdict
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
    auction= AuctionProductSerializer(read_only=True)
    is_auction = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'brand', 'description', 'image', 'images', 'price', 'rating', 'in_stock', 'seller', 'features', 'reviews', 'faqs', 'is_auction', 'auction','options',  'related_products']

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
        category=obj.category, stock__gt=0
    ).exclude(
        pk=obj.pk
    )[:10]
        serializer = ProductListSerializer(related, many=True)
    
        return serializer.data
    
class ProductListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    brand = serializers.StringRelatedField()
    category = serializers.StringRelatedField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'discount_price', 'image', 'brand', 'category', 'rating', 'auction', 'in_stock']

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


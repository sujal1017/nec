from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from Orders.models import Order, OrderItem
from Product.models import Brand, Category, Product, ProductImage, Seller as LegacySeller

from .models import SellerProfile


ALLOWED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def validate_uploaded_image(file_obj):
    if not file_obj:
        return file_obj
    name = file_obj.name.lower()
    if not name.endswith(ALLOWED_IMAGE_EXTENSIONS):
        raise serializers.ValidationError("Upload a JPG, PNG, or WEBP image.")
    if getattr(file_obj, "size", 0) > 5 * 1024 * 1024:
        raise serializers.ValidationError("Image size must be 5MB or smaller.")
    content_type = getattr(file_obj, "content_type", "")
    if content_type and not content_type.startswith("image/"):
        raise serializers.ValidationError("Uploaded file must be an image.")
    return file_obj


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


class SellerProfileSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = [
            "id",
            "business_name",
            "business_email",
            "business_phone",
            "business_address",
            "gst_number",
            "profile_image",
            "logo",
            "logo_url",
            "created_at",
        ]
        read_only_fields = ("id", "logo_url", "created_at")

    def validate_logo(self, value):
        return validate_uploaded_image(value)

    def get_logo_url(self, obj):
        request = self.context.get("request")
        return media_or_legacy_url(obj.logo, request) or obj.profile_image


class SellerProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "is_main"]
        read_only_fields = ("id",)

    def get_image(self, obj):
        request = self.context.get("request")
        return media_or_legacy_url(obj.image, request) or obj.image_url


class SellerProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField()
    brand = serializers.CharField(required=False, allow_blank=True)
    stock_quantity = serializers.IntegerField(source="stock", min_value=0)
    images = SellerProductImageSerializer(many=True, read_only=True)
    thumbnail = serializers.FileField(required=False, allow_null=True)
    uploaded_images = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "brand",
            "price",
            "discount_price",
            "stock_quantity",
            "sku",
            "image",
            "thumbnail",
            "status",
            "is_featured",
            "images",
            "uploaded_images",
            "created_at",
        ]
        read_only_fields = ("id", "slug", "created_at")

    def validate(self, attrs):
        price = attrs.get("price", getattr(self.instance, "price", None))
        discount_price = attrs.get("discount_price", getattr(self.instance, "discount_price", None))
        if discount_price is not None and price is not None and discount_price >= price:
            raise serializers.ValidationError({"discount_price": "Discount price must be lower than price."})
        return attrs

    def validate_thumbnail(self, value):
        return validate_uploaded_image(value)

    def validate_uploaded_images(self, value):
        return [validate_uploaded_image(file_obj) for file_obj in value]

    def _category(self, name):
        category, _ = Category.objects.get_or_create(name=str(name).strip().lower())
        return category

    def _brand(self, name):
        clean_name = str(name or "generic").strip().lower() or "generic"
        brand, _ = Brand.objects.get_or_create(name=clean_name)
        return brand

    def _legacy_seller(self, seller_profile):
        seller, _ = LegacySeller.objects.get_or_create(
            name=seller_profile.business_name,
            defaults={
                "return_policy": "Standard 7 day return policy",
                "warranty": "Manufacturer warranty where applicable",
                "verified": True,
                "description": seller_profile.business_address,
                "location": seller_profile.business_address[:100],
            },
        )
        return seller

    def _sync_images(self, product, images):
        if images is None:
            return
        product.images.all().delete()
        for index, image_file in enumerate(images):
            ProductImage.objects.create(
                product=product,
                image=image_file,
                is_main=index == 0,
            )

    @transaction.atomic
    def create(self, validated_data):
        seller_profile = self.context["seller_profile"]
        images = validated_data.pop("uploaded_images", [])
        category = self._category(validated_data.pop("category"))
        brand = self._brand(validated_data.pop("brand", "generic"))
        product = Product.objects.create(
            **validated_data,
            category=category,
            brand=brand,
            seller=self._legacy_seller(seller_profile),
            seller_profile=seller_profile,
            rating=Decimal("0.0"),
        )
        self._sync_images(product, images)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        images = validated_data.pop("uploaded_images", None)
        if "category" in validated_data:
            instance.category = self._category(validated_data.pop("category"))
        if "brand" in validated_data:
            instance.brand = self._brand(validated_data.pop("brand"))

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        self._sync_images(instance, images)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["category"] = instance.category.name if instance.category else ""
        data["brand"] = instance.brand.name if instance.brand else ""
        if not data.get("image"):
            main_image = instance.images.filter(is_main=True).first() or instance.images.first()
            request = self.context.get("request")
            thumbnail = media_or_legacy_url(instance.thumbnail, request)
            if thumbnail:
                data["image"] = thumbnail
            elif main_image and main_image.image:
                data["image"] = media_or_legacy_url(main_image.image, request)
            elif main_image:
                data["image"] = main_image.image_url
        return data


class SellerOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="name")
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product_id", "product_name", "quantity", "price", "line_total", "image"]

    def get_line_total(self, obj):
        return obj.price * obj.quantity


class SellerOrderSerializer(serializers.ModelSerializer):
    buyer = serializers.CharField(source="user.email")
    order_status = serializers.CharField(source="status")
    payment_status = serializers.SerializerMethodField()
    seller_total = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "buyer", "total_amount", "seller_total", "payment_status", "order_status", "created_at", "items"]

    def get_payment_status(self, obj):
        payment = getattr(obj, "payment", None)
        return payment.status if payment else ("COMPLETED" if obj.status == "PAID" else "PENDING")

    def _seller_items(self, obj):
        seller_profile = self.context["seller_profile"]
        return obj.items.filter(seller=seller_profile)

    def get_seller_total(self, obj):
        return sum(item.price * item.quantity for item in self._seller_items(obj))

    def get_items(self, obj):
        return SellerOrderItemSerializer(self._seller_items(obj), many=True).data

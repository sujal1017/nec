from rest_framework import serializers
from .models import Cart, CartItem

class CartItemSerializer(serializers.ModelSerializer):
    selectedOptions = serializers.JSONField(source="selected_options")
    product_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product_id", "name", "price", "quantity", "image", "selectedOptions"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "name", "items"]

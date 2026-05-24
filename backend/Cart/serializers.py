from rest_framework import serializers
from .models import Cart, CartItem

class CartItemSerializer(serializers.ModelSerializer):
    selectedOptions = serializers.JSONField(source="selected_options")

    class Meta:
        model = CartItem
        fields = ["id", "name", "price", "quantity", "image", "selectedOptions"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "name", "items"]

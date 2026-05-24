from rest_framework import serializers
from .models import Wishlist, WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = ['id', 'name', 'price', 'image', 'selected_options']


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'name', 'created_at', 'items']


# ✅ New lightweight serializer for names only
class WishlistNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'name']

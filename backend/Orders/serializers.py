from rest_framework import serializers
from .models import ShippingAddress, Order, OrderItem, Payment, AuctionProduct, BidHistory, OrderTrackingEvent


# Shipping Address
class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = "__all__"
        read_only_fields = ("user", "created_at")


# Order Item
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product_id", "name", "price", "quantity",
            "image", "selected_options", "is_auction_item", "bid_amount"
        ]


# Order
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "created_at", "status", "payment_method",
            "total_amount", "shipping_address", "items"
        ]


class OrderTrackingEventSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = OrderTrackingEvent
        fields = ["status", "label", "timestamp", "note"]


# Payment
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "order", "mode", "status", "amount", "transaction_id", "created_at"]


# Bid History
class BidHistorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = BidHistory
        fields = ["id", "auction", "product", "user", "amount", "timestamp", "product_name", "product_image"]


#  Auction Product (for viewing + details)
class AuctionProductSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    bid_history = BidHistorySerializer(many=True, read_only=True)
    current_highest_bidder = serializers.StringRelatedField()
    is_user_highest_bidder = serializers.SerializerMethodField()
    total_bids = serializers.SerializerMethodField()
    is_user_highest_bidder = serializers.SerializerMethodField()
    user_last_bid_amount = serializers.SerializerMethodField() 

    class Meta:
        model = AuctionProduct
        fields = [
            "id", "product", "start_time", "end_time",
            "current_highest_bid", "current_highest_bidder",
            "is_user_highest_bidder", "total_bids", "user_last_bid_amount", "bid_history"
        ]

    def get_product(self, obj):
        prod = obj.product
        image_url = prod.images.first().image if hasattr(prod, "images") and prod.images.exists() else None
        return {"id": prod.id, "name": prod.name, "image": image_url}

    def get_is_user_highest_bidder(self, obj):
        user = self.context.get("request").user
        return obj.current_highest_bidder == user
   
    def get_total_bids(self, obj):
        return obj.bid_history.count()
    
    def get_user_last_bid_amount(self, obj):
        user = self.context.get("request").user
        if not user or user.is_anonymous:
            return None
        last_bid = obj.bid_history.filter(user=user).order_by("-timestamp").first()
        return last_bid.amount if last_bid else None

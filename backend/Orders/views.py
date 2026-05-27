from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.utils import timezone

from Cart.models import Cart, CartItem
from Product.models import Product
from .models import ShippingAddress, Order, OrderItem, Payment, AuctionProduct, BidHistory, OrderTrackingEvent
from .serializers import (
    ShippingAddressSerializer,
    OrderSerializer,
    PaymentSerializer,
    AuctionProductSerializer,
    BidHistorySerializer,
    OrderTrackingEventSerializer,
)

# CREATE ORDER FROM CART
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order_from_cart(request):
    """
    Request Example:
    {
      "cart_id": 12,
      "shippingAddress": {
          "address_line1": "123 Street",
          "city": "New York",
          "state": "NY",
          "postal_code": "10001",
          "country": "USA",
          "phone": "+11234567890"
      },
      "payment_method": "COD" | "ONLINE" | "WALLET"
    }
    """
    user = request.user
    cart_id = request.data.get("cart_id")
    if not cart_id:
        return Response({"error": "cart_id is required"}, status=400)

    cart = get_object_or_404(Cart, id=cart_id, user=user)
    cart_items = CartItem.objects.filter(cart=cart)
    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    shipping_data = request.data.get("shippingAddress")
    if not shipping_data:
        return Response({"error": "Shipping address required"}, status=400)

    ship_ser = ShippingAddressSerializer(data=shipping_data)
    ship_ser.is_valid(raise_exception=True)
    shipping_address = ship_ser.save(user=user)

    payment_method = request.data.get("payment_method", "COD")
    total = sum([item.price * item.quantity for item in cart_items])

    order = Order.objects.create(
        user=user,
        cart=cart,
        shipping_address=shipping_address,
        payment_method=payment_method,
        total_amount=Decimal(total),
    )

    for ci in cart_items:
        prod = get_object_or_404(Product, id=ci.product_id)
        image_url = prod.image or (prod.images.first().image if hasattr(prod, "images") and prod.images.exists() else None)

        OrderItem.objects.create(
            order=order,
            product_id=prod.id,
            product=prod,
            seller=prod.seller_profile,
            name=prod.name,
            price=ci.price,
            quantity=ci.quantity,
            image=image_url,
            selected_options=ci.selected_options,
        )

    # Auto payment creation
    payment_status = "COMPLETED" if payment_method in ["ONLINE", "WALLET"] else "PENDING"
    Payment.objects.create(
        order=order,
        mode=payment_method,
        amount=Decimal(total),
        transaction_id=f"AUTO-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        status=payment_status,
    )

    order.status = "PAID" if payment_status == "COMPLETED" else "PENDING"
    order.save()
    OrderTrackingEvent.objects.get_or_create(
        order=order,
        status=OrderTrackingEvent.STATUS_ORDERED,
        defaults={"note": "Your order has been placed."},
    )
    cart.delete()

    return Response({"message": "Order created successfully", "order": OrderSerializer(order).data}, status=201)


# OPTIONAL PAYMENT ENDPOINT
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment(request):
    user = request.user
    order = get_object_or_404(Order, id=request.data.get("order_id"), user=user)
    amount = Decimal(str(request.data.get("amount", order.total_amount)))
    mode = request.data.get("mode", "COD")
    txn = request.data.get("transaction_id", None)
    payment, _ = Payment.objects.update_or_create(
        order=order,
        defaults={
            "mode": mode,
            "amount": amount,
            "transaction_id": txn,
            "status": "COMPLETED" if mode != "COD" else "PENDING",
        },
    )

    order.status = "PAID" if payment.status == "COMPLETED" else "PENDING"
    order.save()

    return Response({"message": "Payment recorded", "payment": PaymentSerializer(payment).data}, status=200)


# USER ORDERS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_orders(request):
    user = request.user
    orders = Order.objects.filter(user=user).order_by("-created_at")
    return Response(OrderSerializer(orders, many=True).data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_tracking(request, order_id):
    order = get_object_or_404(Order.objects.prefetch_related("tracking_events"), id=order_id, user=request.user)
    status_to_step = {
        "PENDING": OrderTrackingEvent.STATUS_ORDERED,
        "PAID": OrderTrackingEvent.STATUS_ORDERED,
        "PROCESSING": OrderTrackingEvent.STATUS_PACKED,
        "SHIPPED": OrderTrackingEvent.STATUS_SHIPPED,
        "DELIVERED": OrderTrackingEvent.STATUS_DELIVERED,
    }
    current_step = status_to_step.get(order.status, OrderTrackingEvent.STATUS_ORDERED)
    order_rank = [
        OrderTrackingEvent.STATUS_ORDERED,
        OrderTrackingEvent.STATUS_PACKED,
        OrderTrackingEvent.STATUS_SHIPPED,
        OrderTrackingEvent.STATUS_OUT_FOR_DELIVERY,
        OrderTrackingEvent.STATUS_DELIVERED,
    ]
    existing = {event.status: event for event in order.tracking_events.all()}
    if OrderTrackingEvent.STATUS_ORDERED not in existing:
        existing[OrderTrackingEvent.STATUS_ORDERED], _ = OrderTrackingEvent.objects.get_or_create(
            order=order,
            status=OrderTrackingEvent.STATUS_ORDERED,
            defaults={"timestamp": order.created_at, "note": "Your order has been placed."},
        )
    current_index = order_rank.index(current_step)
    timeline = []
    for index, step in enumerate(order_rank):
        event = existing.get(step)
        timeline.append({
            "status": step,
            "label": dict(OrderTrackingEvent.STATUS_CHOICES)[step],
            "timestamp": event.timestamp if event and index <= current_index else None,
            "note": event.note if event else "",
            "completed": index <= current_index,
            "current": index == current_index,
        })
    return Response({"orderId": order.id, "orderStatus": order.status, "timeline": timeline}, status=200)


# AUCTION DETAILS (for viewing before bidding)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auction_details(request, auction_id):
    auction = get_object_or_404(AuctionProduct, id=auction_id)
    serializer = AuctionProductSerializer(auction, context={"request": request})
    return Response(serializer.data, status=200)


# PLACE BID
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_bid(request, auction_id):
    user = request.user
    auction = get_object_or_404(AuctionProduct, id=auction_id)
    amount = Decimal(str(request.data.get("amount", "0")))

    if not auction.is_active():
        return Response({"error": "Auction not active"}, status=400)
    if amount <= auction.current_highest_bid:
        return Response({"error": "Bid must be higher than current bid"}, status=400)

    prod = auction.product
    image_url = prod.images.first().image if hasattr(prod, "images") and prod.images.exists() else None

    BidHistory.objects.create(
        auction=auction,
        product=prod,
        user=user,
        amount=amount,
        product_name=prod.name,
        product_image=image_url,
    )

    auction.current_highest_bid = amount
    auction.current_highest_bidder = user
    auction.save()

    return Response({
        "message": "Bid placed successfully",
        "auction": AuctionProductSerializer(auction, context={"request": request}).data
    }, status=200)


# MY BIDS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_bids(request):
    user = request.user
    bids = BidHistory.objects.filter(user=user).select_related("auction", "product").order_by("-timestamp")
    response = []
    for bid in bids:
        auction = bid.auction
        now = timezone.now()
        if now < auction.end_time:
            status_str = "ONGOING"
        elif auction.current_highest_bidder == user:
            status_str = "WON"
        else:
            status_str = "LOST"

        response.append({
            "id": bid.id,
            "amount": bid.amount,
            "timestamp": bid.timestamp,
            "product_name": bid.product_name,
            "product_image": bid.product_image,
            "status": status_str
        })
    return Response(response, status=200)

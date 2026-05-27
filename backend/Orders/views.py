from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from Cart.models import Cart, CartItem
from Customer.models import CustomerAddress
from Product.models import Product
from .models import ShippingAddress, Order, OrderItem, Payment, AuctionProduct, BidHistory
from .serializers import (
    ShippingAddressSerializer,
    OrderSerializer,
    PaymentSerializer,
    AuctionProductSerializer,
    BidHistorySerializer,
)


def product_image_url(product):
    if product.thumbnail:
        try:
            return product.thumbnail.url
        except ValueError:
            pass
    if product.image:
        return product.image
    image_obj = product.images.filter(is_main=True).first() or product.images.first()
    if not image_obj:
        return ""
    if image_obj.image:
        try:
            return image_obj.image.url
        except ValueError:
            return str(image_obj.image)
    return image_obj.image_url or ""


def save_customer_address(user, shipping_data):
    address1 = shipping_data.get("addressLine1", "").strip()
    city = shipping_data.get("city", "").strip()
    state = shipping_data.get("state", "").strip()
    zip_code = shipping_data.get("pin_code", "").strip()
    if not address1 or not city or not state or not zip_code:
        return None

    address, _ = CustomerAddress.objects.get_or_create(
        custId=user,
        address1=address1,
        city=city,
        state=state,
        zipCode=zip_code,
        defaults={
            "label": "Checkout address",
            "address2": shipping_data.get("addressLine2", ""),
            "country": shipping_data.get("country", "India"),
        },
    )
    return address

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
    cart_ids = request.data.get("cartIds") or request.data.get("cart_ids") or []
    cart_id = request.data.get("cart_id")
    if cart_id:
        cart_ids = [cart_id]
    if not cart_ids:
        return Response({"error": "cartIds is required"}, status=400)

    carts = Cart.objects.filter(id__in=cart_ids, user=user)
    if carts.count() != len(set([str(cart_id) for cart_id in cart_ids])):
        return Response({"error": "One or more carts were not found."}, status=400)
    cart_items = CartItem.objects.filter(cart__in=carts)
    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    shipping_data = request.data.get("shippingAddress") or request.data.get("shipping_address")
    if not shipping_data:
        return Response({"error": "Shipping address required"}, status=400)
    shipping_data = {
        "first_name": shipping_data.get("first_name") or shipping_data.get("firstName") or "",
        "last_name": shipping_data.get("last_name") or shipping_data.get("lastName") or "",
        "email": shipping_data.get("email") or "",
        "addressLine1": shipping_data.get("addressLine1") or shipping_data.get("address_line1") or "",
        "addressLine2": shipping_data.get("addressLine2") or shipping_data.get("address_line2") or "",
        "city": shipping_data.get("city") or "",
        "state": shipping_data.get("state") or "",
        "country": shipping_data.get("country") or "India",
        "pin_code": shipping_data.get("pin_code") or shipping_data.get("pinCode") or shipping_data.get("postal_code") or "",
    }

    payment_method = request.data.get("payment_method", "COD")
    valid_methods = {choice[0] for choice in Payment._meta.get_field("mode").choices}
    if payment_method not in valid_methods:
        return Response({"error": "Invalid payment method."}, status=400)

    with transaction.atomic():
        ship_ser = ShippingAddressSerializer(data=shipping_data)
        ship_ser.is_valid(raise_exception=True)
        shipping_address = ship_ser.save(user=user)
        save_customer_address(user, shipping_data)

        total = sum([item.price * item.quantity for item in cart_items])
        order = Order.objects.create(
            user=user,
            cart=carts.first(),
            shipping_address=shipping_address,
            payment_method=payment_method,
            total_amount=Decimal(total),
        )

        for ci in cart_items:
            prod = get_object_or_404(Product, id=ci.product_id)
            if prod.stock < ci.quantity:
                return Response({"error": f"{prod.name} does not have enough stock."}, status=400)
            image_url = product_image_url(prod)

            OrderItem.objects.create(
                order=order,
                product=prod,
                seller=prod.seller_profile,
                name=prod.name,
                price=ci.price,
                quantity=ci.quantity,
                image=image_url,
                selected_options=ci.selected_options,
            )
            prod.stock = max(0, prod.stock - ci.quantity)
            prod.save(update_fields=["stock"])

        payment_status = "COMPLETED" if payment_method in ["UPI", "Credit/Debit Card", "PayPal"] else "PENDING"
        Payment.objects.create(
            order=order,
            mode=payment_method,
            amount=Decimal(total),
            transaction_id=f"AUTO-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            status=payment_status,
        )

        order.status = "PAID" if payment_status == "COMPLETED" else "PENDING"
        order.save()
        carts.delete()

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

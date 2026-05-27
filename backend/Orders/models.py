from django.db import models
from django.utils import timezone
from decimal import Decimal
from Customer.models import Customer
from Product.models import Product
from Cart.models import Cart


PAYMENT_CHOICES = [
    ("COD", "Cash on Delivery"),
    ("PayPal", "Online Payment"),
    ("Credit/Debit Card", "Card Payment"),
    ("UPI", "upi payment"),
]

ORDER_STATUS = [
    ("PENDING", "Pending"),
    ("PAID", "Paid"),
    ("PROCESSING", "Processing"),
    ("SHIPPED", "Shipped"),
    ("DELIVERED", "Delivered"),
    ("CANCELLED", "Cancelled"),
]


class ShippingAddress(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="shipping_addresses")
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True, null=True)
    addressLine1 = models.CharField(max_length=255)
    addressLine2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="India")
    pin_code = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.address_line1}, {self.city}"


class Order(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="orders")
    cart = models.ForeignKey(Cart, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    shipping_address = models.ForeignKey(ShippingAddress, on_delete=models.SET_NULL, null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="COD")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        db_column="product_id",
    )
    seller = models.ForeignKey(
        "Seller.SellerProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    image = models.URLField(blank=True, null=True)
    selected_options = models.JSONField(default=dict, blank=True)
    is_auction_item = models.BooleanField(default=False)
    bid_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.name} (x{self.quantity})"


class OrderTrackingEvent(models.Model):
    STATUS_ORDERED = "ORDER_PLACED"
    STATUS_PACKED = "PACKED"
    STATUS_SHIPPED = "SHIPPED"
    STATUS_OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    STATUS_DELIVERED = "DELIVERED"
    STATUS_CHOICES = [
        (STATUS_ORDERED, "Order Placed"),
        (STATUS_PACKED, "Packed"),
        (STATUS_SHIPPED, "Shipped"),
        (STATUS_OUT_FOR_DELIVERY, "Out For Delivery"),
        (STATUS_DELIVERED, "Delivered"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="tracking_events")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("order", "status")
        ordering = ["timestamp"]

    def __str__(self):
        return f"Order #{self.order_id}: {self.status}"


class Payment(models.Model):
    PAYMENT_STATUS = [
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    mode = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="COD")
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default="PENDING")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for order {self.order.id} ({self.mode})"


class AuctionProduct(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="auction")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    current_highest_bid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    current_highest_bidder = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="winning_auctions")

    def is_active(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    def status(self):
        now = timezone.now()
        if now < self.start_time:
            return "NOT_STARTED"
        if now > self.end_time:
            return "ENDED"
        return "ONGOING"

    def __str__(self):
        return f"Auction for {self.product.name}"


class BidHistory(models.Model):
    auction = models.ForeignKey(AuctionProduct, on_delete=models.CASCADE, related_name="bid_history")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="bids")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    product_name = models.CharField(max_length=255)
    product_image = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} bid {self.amount} on {self.product_name}"

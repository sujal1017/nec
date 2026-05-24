from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from Product.models import AuctionBid
from .models import Order, Payment


@receiver(post_save, sender=AuctionBid)
def create_order_from_auction_bid(sender, instance, created, **kwargs):
    """
    When an auction ends, create an order for the winning bid.
    """
    auction = instance.auction

    if timezone.now() < auction.end_time:
        return

    highest_bid = auction.bids.order_by("-amount", "time").first()
    if not highest_bid or highest_bid.id != instance.id:
        return

    if Order.objects.filter(auction_bid=highest_bid).exists():
        return

    order = Order.objects.create(
        user=highest_bid.user,
        auction_bid=highest_bid,
        total=highest_bid.amount,
        status="PENDING",
    )

    Payment.objects.create(
        order=order,
        modeOfPayment="COD",
        status="PENDING",
    )


@receiver(post_save, sender=Order)
def create_payment_for_order(sender, instance, created, **kwargs):
    """
    Ensure every order has a payment record.
    """
    if created and not hasattr(instance, "payment"):
        Payment.objects.create(
            order=instance,
            modeOfPayment="COD",
            status="PENDING",
        )
@receiver(post_save, sender=Payment)
def sync_order_status(sender, instance, **kwargs):
    order = instance.order
    if instance.status == "COMPLETED":
        order.status = "PAID"
    elif instance.status == "FAILED":
        order.status = "CANCELLED"
    order.save()


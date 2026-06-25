import os
import random
import sys
from pathlib import Path
from django.conf import settings
from django.core.files import File
from datetime import date, timedelta
from decimal import Decimal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "EcommerceProject.settings")

import django

django.setup()

from Customer.models import Customer
from Product.models import (
    Brand,
    Category,
    CustomerSupport,
    FAQ,
    Product,
    ProductImage,
    Review,
    Seller,
    SellerReview,
)



def get_product_images(slug):
    folder = Path(settings.MEDIA_ROOT) / "products" / slug

    if not folder.exists():
        return []

    return sorted(folder.glob("*.webp"))

def money(value):
    return Decimal(str(value)).quantize(Decimal("0.01"))


def discount_price(price, discount):
    return money(price * (100 - discount) / 100)


CUSTOMERS = [
    ("aanya.sharma", "Aanya Sharma", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"),
    ("rohan.mehra", "Rohan Mehra", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop"),
    ("meera.iyer", "Meera Iyer", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop"),
    ("kabir.rao", "Kabir Rao", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop"),
    ("neha.kapoor", "Neha Kapoor", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop"),
    ("arjun.nair", "Arjun Nair", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop"),
]

SELLERS = [
    {
        "name": "Nexa Threads",
        "shop_name": "Nexa Streetwear Co.",
        "email": "hello@nexathreads.example",
        "phone": "+91 98765 41001",
        "address": "12 Brigade Road, Bengaluru, Karnataka",
        "description": "Modern everyday apparel with durable fabrics, clean fits, and quick dispatch across India.",
        "profile_image": "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=320&h=320&fit=crop",
        "banner_image": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&h=520&fit=crop",
        "rating": 4.7,
        "total_sales": 1840,
        "followers": 12800,
        "joined_date": date(2023, 3, 14),
        "shipping_time": "2-4 business days",
        "business_hours": "10 AM - 8 PM",
    },
    {
        "name": "Urban Sole Lab",
        "shop_name": "Urban Sole Lab",
        "email": "care@urbansole.example",
        "phone": "+91 98765 41002",
        "address": "44 Linking Road, Mumbai, Maharashtra",
        "description": "Sneakers, bags, and accessories curated for city commutes, workouts, and weekend travel.",
        "profile_image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=320&h=320&fit=crop",
        "banner_image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&h=520&fit=crop",
        "rating": 4.6,
        "total_sales": 2210,
        "followers": 9400,
        "joined_date": date(2022, 9, 2),
        "shipping_time": "1-3 business days",
        "business_hours": "9 AM - 7 PM",
    },
    {
        "name": "Chrono Craft",
        "shop_name": "Chrono Craft Watches",
        "email": "support@chronocraft.example",
        "phone": "+91 98765 41003",
        "address": "8 Park Street, Kolkata, West Bengal",
        "description": "Premium watches and refined accessories with careful packaging and trusted after-sales support.",
        "profile_image": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=320&h=320&fit=crop",
        "banner_image": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1600&h=520&fit=crop",
        "rating": 4.8,
        "total_sales": 1560,
        "followers": 7600,
        "joined_date": date(2021, 11, 18),
        "shipping_time": "2-5 business days",
        "business_hours": "10 AM - 6 PM",
    },
    {
        "name": "Pulse Gadget Hub",
        "shop_name": "Pulse Gadget Hub",
        "email": "help@pulsegadget.example",
        "phone": "+91 98765 41004",
        "address": "21 Cyber City, Gurugram, Haryana",
        "description": "Fast-moving electronics, headphones, and smart accessories with warranty-backed catalog selections.",
        "profile_image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320&h=320&fit=crop",
        "banner_image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&h=520&fit=crop",
        "rating": 4.5,
        "total_sales": 3125,
        "followers": 18400,
        "joined_date": date(2020, 6, 7),
        "shipping_time": "1-4 business days",
        "business_hours": "9 AM - 9 PM",
    },
    {
        "name": "Canvas Carry",
        "shop_name": "Canvas Carry Studio",
        "email": "orders@canvascarry.example",
        "phone": "+91 98765 41005",
        "address": "5 C Scheme, Jaipur, Rajasthan",
        "description": "Functional bags, shirts, jeans, and daily accessories made for practical, polished routines.",
        "profile_image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=320&h=320&fit=crop",
        "banner_image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600&h=520&fit=crop",
        "rating": 4.4,
        "total_sales": 1385,
        "followers": 6300,
        "joined_date": date(2024, 1, 22),
        "shipping_time": "3-5 business days",
        "business_hours": "10 AM - 7 PM",
    },
]

PRODUCTS = [
    ("Nexa Threads", "Oversized Black Hoodie", "Threadborne", "Hoodies", 3299, 18, "Black", "S,M,L,XL", "Fleece cotton", "620 g"),
    ("Nexa Threads", "Washed Denim Jeans", "Threadborne", "Jeans", 2799, 15, "Indigo", "30,32,34,36", "Stretch denim", "710 g"),
    ("Nexa Threads", "Organic Crew T-Shirt", "Threadborne", "T-Shirts", 1199, 20, "White", "S,M,L,XL", "Organic cotton", "220 g"),
    ("Nexa Threads", "Oxford Casual Shirt", "Mode & Co", "Shirts", 2199, 12, "Sky Blue", "S,M,L,XL", "Oxford cotton", "330 g"),
    ("Nexa Threads", "Zip Pocket Hoodie", "Mode & Co", "Hoodies", 3499, 16, "Olive", "S,M,L,XL", "Cotton blend", "650 g"),
    ("Nexa Threads", "Classic Polo T-Shirt", "AeroWear", "T-Shirts", 1499, 10, "Navy", "S,M,L,XL", "Pique cotton", "240 g"),
    ("Nexa Threads", "Slim Grey Jeans", "AeroWear", "Jeans", 2499, 14, "Grey", "30,32,34,36", "Cotton elastane", "690 g"),
    ("Nexa Threads", "Linen Resort Shirt", "Mode & Co", "Shirts", 2699, 11, "Beige", "S,M,L,XL", "Linen blend", "280 g"),
    ("Nexa Threads", "Graphic Street T-Shirt", "Threadborne", "T-Shirts", 999, 25, "Charcoal", "S,M,L,XL", "Cotton jersey", "210 g"),
    ("Nexa Threads", "Relaxed Cargo Jeans", "AeroWear", "Jeans", 3199, 17, "Khaki", "30,32,34,36", "Twill denim", "760 g"),
    ("Urban Sole Lab", "AirFlex Running Shoes", "StrideX", "Shoes", 5999, 22, "Blue", "7,8,9,10,11", "Engineered mesh", "820 g"),
    ("Urban Sole Lab", "Court Classic Sneakers", "StrideX", "Shoes", 4499, 18, "White", "7,8,9,10,11", "Vegan leather", "790 g"),
    ("Urban Sole Lab", "Trail Grip Shoes", "TerraRun", "Shoes", 6999, 19, "Black", "7,8,9,10,11", "Ripstop mesh", "910 g"),
    ("Urban Sole Lab", "Everyday Sling Bag", "CarryKind", "Bags", 1899, 12, "Tan", "One Size", "Canvas", "390 g"),
    ("Urban Sole Lab", "Gym Duffel Bag", "CarryKind", "Bags", 2999, 20, "Black", "32 L", "Polyester", "780 g"),
    ("Urban Sole Lab", "Minimal Laptop Backpack", "CarryKind", "Bags", 3899, 16, "Graphite", "24 L", "Nylon", "900 g"),
    ("Urban Sole Lab", "Ribbed Crew Socks", "StrideX", "Accessories", 599, 15, "Assorted", "Free Size", "Cotton blend", "160 g"),
    ("Urban Sole Lab", "Sport Cap", "StrideX", "Accessories", 999, 10, "Forest Green", "Adjustable", "Cotton twill", "120 g"),
    ("Urban Sole Lab", "Waterproof Shoe Cleaner", "TerraRun", "Accessories", 799, 18, "Clear", "250 ml", "Cleaning solution", "300 g"),
    ("Urban Sole Lab", "Commuter Waist Pack", "CarryKind", "Bags", 1499, 14, "Navy", "3 L", "Recycled nylon", "260 g"),
    ("Chrono Craft", "Aster Chronograph Watch", "Aster", "Watches", 8999, 20, "Silver", "42 mm", "Stainless steel", "180 g"),
    ("Chrono Craft", "Heritage Leather Watch", "Aster", "Watches", 7499, 16, "Brown", "40 mm", "Leather, steel", "150 g"),
    ("Chrono Craft", "Minimal Mesh Watch", "Linea", "Watches", 6299, 12, "Rose Gold", "36 mm", "Steel mesh", "120 g"),
    ("Chrono Craft", "Diver Sport Watch", "Marino", "Watches", 11999, 18, "Black", "44 mm", "Stainless steel", "210 g"),
    ("Chrono Craft", "Smart Hybrid Watch", "Linea", "Watches", 9999, 15, "Blue", "42 mm", "Aluminium", "135 g"),
    ("Chrono Craft", "Leather Card Holder", "Linea", "Accessories", 1299, 10, "Cognac", "One Size", "Full-grain leather", "90 g"),
    ("Chrono Craft", "Sunglasses Aviator", "Marino", "Accessories", 2499, 22, "Gold", "Medium", "Metal, polycarbonate", "80 g"),
    ("Chrono Craft", "Bracelet Stack Set", "Aster", "Accessories", 1599, 12, "Black", "Adjustable", "Stone, steel", "110 g"),
    ("Chrono Craft", "Watch Travel Case", "Marino", "Accessories", 1999, 15, "Black", "2 slots", "Vegan leather", "280 g"),
    ("Chrono Craft", "Classic Belt", "Linea", "Accessories", 1799, 18, "Dark Brown", "32,34,36,38", "Leather", "240 g"),
    ("Pulse Gadget Hub", "SonicWave ANC Headphones", "SonicWave", "Headphones", 7999, 25, "Black", "One Size", "ABS, memory foam", "260 g"),
    ("Pulse Gadget Hub", "BassBuds Pro Earbuds", "SonicWave", "Headphones", 4999, 20, "White", "One Size", "ABS", "58 g"),
    ("Pulse Gadget Hub", "NovaTab 10 Tablet", "NovaTech", "Electronics", 24999, 14, "Grey", "128 GB", "Aluminium", "470 g"),
    ("Pulse Gadget Hub", "VoltCharge Power Bank", "Volt", "Electronics", 2499, 18, "Black", "20000 mAh", "ABS", "430 g"),
    ("Pulse Gadget Hub", "Arc Wireless Keyboard", "NovaTech", "Electronics", 3499, 16, "Silver", "Full Size", "Aluminium, plastic", "610 g"),
    ("Pulse Gadget Hub", "Focus Webcam 2K", "NovaTech", "Electronics", 4299, 12, "Black", "One Size", "ABS, glass", "180 g"),
    ("Pulse Gadget Hub", "Travel Bluetooth Speaker", "SonicWave", "Electronics", 3799, 22, "Orange", "One Size", "Rubber, fabric", "520 g"),
    ("Pulse Gadget Hub", "Gaming Mouse RGB", "Volt", "Electronics", 2299, 19, "Black", "One Size", "ABS", "95 g"),
    ("Pulse Gadget Hub", "USB-C Hub 8-in-1", "Volt", "Electronics", 2999, 15, "Space Grey", "One Size", "Aluminium", "120 g"),
    ("Pulse Gadget Hub", "Studio Monitor Headphones", "SonicWave", "Headphones", 6499, 17, "Charcoal", "One Size", "ABS, protein leather", "290 g"),
    ("Canvas Carry", "Waxed Canvas Backpack", "CarryKind", "Bags", 4599, 18, "Olive", "26 L", "Waxed canvas", "980 g"),
    ("Canvas Carry", "Weekender Travel Bag", "CarryKind", "Bags", 5499, 20, "Brown", "38 L", "Canvas, leather", "1250 g"),
    ("Canvas Carry", "Chambray Work Shirt", "Mode & Co", "Shirts", 2399, 14, "Chambray", "S,M,L,XL", "Cotton chambray", "310 g"),
    ("Canvas Carry", "Corduroy Overshirt", "Mode & Co", "Shirts", 3299, 16, "Rust", "S,M,L,XL", "Cotton corduroy", "520 g"),
    ("Canvas Carry", "Straight Fit Jeans", "AeroWear", "Jeans", 2899, 13, "Dark Blue", "30,32,34,36", "Denim", "720 g"),
    ("Canvas Carry", "Canvas Tote Bag", "CarryKind", "Bags", 1399, 10, "Natural", "18 L", "Heavy canvas", "350 g"),
    ("Canvas Carry", "Travel Organizer Pouch", "CarryKind", "Accessories", 899, 15, "Grey", "One Size", "Nylon", "140 g"),
    ("Canvas Carry", "Everyday Leather Wallet", "Linea", "Accessories", 1499, 12, "Black", "One Size", "Leather", "100 g"),
    ("Canvas Carry", "Cotton Baseball Cap", "AeroWear", "Accessories", 799, 10, "Maroon", "Adjustable", "Cotton twill", "115 g"),
    ("Canvas Carry", "Lightweight Hooded Jacket", "Threadborne", "Hoodies", 3999, 18, "Slate", "S,M,L,XL", "Nylon shell", "540 g"),
]

REVIEW_TEXT = [
    (5, "Excellent quality", "Really loved this product. The finish and fit feel premium."),
    (5, "Worth the money", "Fast delivery and good quality. It matched the photos well."),
    (4, "Good product", "Satisfied with the purchase and packaging was neat."),
    (4, "Reliable choice", "Looks good after regular use and the seller shipped on time."),
]

SELLER_REVIEW_TEXT = [
    (5, "Quick dispatch", "Seller shipped quickly and shared clear updates."),
    (5, "Excellent packaging", "Packaging was secure and the item arrived in perfect condition."),
    (4, "Responsive seller", "Support answered my query politely and resolved it fast."),
    (4, "Smooth purchase", "Good catalog quality and dependable delivery timelines."),
]


def reset_marketplace():
    SellerReview.objects.all().delete()
    Review.objects.all().delete()
    FAQ.objects.all().delete()
    ProductImage.objects.all().delete()
    Product.objects.all().delete()
    CustomerSupport.objects.all().delete()
    Seller.objects.all().delete()
    Brand.objects.all().delete()
    Category.objects.all().delete()


def seed_customers():
    users = []
    for username, name, avatar in CUSTOMERS:
        user, _ = Customer.objects.update_or_create(
            username=username,
            defaults={
                "name": name,
                "email": f"{username}@example.com",
                "avatar": avatar,
                "is_verified": True,
                "email_verified": True,
                "phone_verified": True,
                "user_status": Customer.STATUS_ACTIVE,
                "account_type": "personal",
            },
        )
        user.set_password("TestPass123!")
        user.save(update_fields=["password"])
        users.append(user)
    return users


def main():
    random.seed(42)
    print("Resetting marketplace seed data...")
    reset_marketplace()
    users = seed_customers()

    categories = {name: Category.objects.create(name=name) for name in sorted({item[3] for item in PRODUCTS})}
    brands = {name: Brand.objects.create(name=name) for name in sorted({item[2] for item in PRODUCTS})}

    sellers = {}
    for data in SELLERS:
        seller = Seller.objects.create(
            name=data["name"],
            rating=data["rating"],
            return_policy="7-day easy return for unused products with original packaging.",
            warranty="Brand warranty or seller assurance as listed per product.",
            total_sales=data["total_sales"],
            joined_date=data["joined_date"],
            verified=True,
            description=data["description"],
            business_hours=data["business_hours"],
            shipping_time=data["shipping_time"],
            location=data["address"],
            badges={
                "shop_name": data["shop_name"],
                "email": data["email"],
                "phone": data["phone"],
                "profile_image": data["profile_image"],
                "banner_image": data["banner_image"],
                "followers": data["followers"],
            },
        )
        CustomerSupport.objects.create(seller=seller, email=data["email"], phone=data["phone"], response_time="Within 4 hours")
        sellers[data["name"]] = seller

        for index, (rating, title, comment) in enumerate(SELLER_REVIEW_TEXT):
            SellerReview.objects.create(
                seller=seller,
                user=users[(index + len(sellers)) % len(users)],
                rating=rating,
                title=title,
                comment=comment,
                date=date.today() - timedelta(days=25 + index * 9),
            )

    for index, item in enumerate(PRODUCTS, start=1):
        seller_name, name, brand_name, category_name, price, discount, color, size, material, weight = item
        seller = sellers[seller_name]
        final_price = discount_price(price, discount)
        category = categories[category_name]
        brand = brands[brand_name]
        keywords = f"{name} {brand_name} {category_name} {color} {material} online shopping"
        product = Product.objects.create(
            name=name,
            short_description=f"{brand_name} {category_name.lower()} in {color.lower()} with trusted seller support.",
            description=(
                f"{name} from {brand_name} is designed for everyday use with a polished finish, reliable materials, "
                f"and marketplace-ready quality checks. It includes careful packaging, seller-backed support, "
                f"and a practical design suited for modern shopping needs."
            ),
            price=money(price),
            discount_price=final_price,
            rating=Decimal(str(round(4.1 + (index % 8) * 0.1, 1))),
            stock=18 + (index * 7) % 85,
            category=category,
            brand=brand,
            seller=seller,
            sku=f"{brand_name[:3].upper()}-{category_name[:3].upper()}-{index:03d}",
            color=color,
            size=size,
            material=material,
            weight=weight,
            keywords=keywords,
            image="",
            shipping_information=seller.shipping_time,
            return_policy=seller.return_policy,
            status=Product.STATUS_ACTIVE,
            is_featured=index <= 20 or index % 3 == 0,
            features=[
                f"Brand: {brand_name}",
                f"Material: {material}",
                f"Available sizes: {size}",
                f"Color: {color}",
                f"Estimated delivery: {seller.shipping_time}",
                "Verified purchase support",
            ],
        )


        images = get_product_images(product.slug)

        if images:
            with open(images[0], "rb") as f:
                product.image.save(images[0].name, File(f), save=True)


        ProductImage.objects.filter(product=product).delete()

        for img in images[1:]:
            product_image = ProductImage.objects.create(
                product=product,
                is_main=False,
            )

            with open(img, "rb") as f:
                product_image.image.save(img.name, File(f), save=True)

        for review_index, (rating, title, comment) in enumerate(REVIEW_TEXT):
            Review.objects.create(
                product=product,
                user=users[(index + review_index) % len(users)],
                rating=rating,
                title=title,
                comment=comment,
                date=date.today() - timedelta(days=review_index * 8 + index % 11),
            )

        FAQ.objects.create(
            product=product,
            question="Is this product eligible for return?",
            answer=product.return_policy,
        )
        FAQ.objects.create(
            product=product,
            question="How long does delivery usually take?",
            answer=product.shipping_information,
        )

    print("Seeded 5 sellers, 50 products, product reviews, seller reviews, categories, and brands.")


if __name__ == "__main__":
    main()

import os, sys, django, random
sys.path.insert(0, r'C:\Users\hp\OneDrive\Desktop\E-comm_team_1\backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'EcommerceProject.settings'
django.setup()

from Customer.models import Customer, OTPVerification, AuthAuditLog, CustomerAddress, Subscriber
from Seller.models import SellerProfile
from Product.models import Category, Brand, Seller, Product, ProductImage, CustomerSupport, Review, FAQ, RecentlyViewedProduct, SearchHistory
from Orders.models import Order, OrderItem, ShippingAddress, OrderTrackingEvent, Payment, AuctionProduct, BidHistory
from Cart.models import Cart, CartItem
from WishList.models import Wishlist, WishlistItem
from Customer.keycloak import delete_keycloak_user, create_keycloak_user, update_keycloak_email_verified

print("=== STARTING DATABASE CLEANUP ===")

# Delete order-related records
print("Deleting orders & bids...")
BidHistory.objects.all().delete()
AuctionProduct.objects.all().delete()
Payment.objects.all().delete()
OrderTrackingEvent.objects.all().delete()
OrderItem.objects.all().delete()
Order.objects.all().delete()
ShippingAddress.objects.all().delete()

# Delete cart and wishlist
print("Deleting carts & wishlists...")
CartItem.objects.all().delete()
Cart.objects.all().delete()
WishlistItem.objects.all().delete()
Wishlist.objects.all().delete()

# Delete product-related records
print("Deleting products, brands & categories...")
RecentlyViewedProduct.objects.all().delete()
SearchHistory.objects.all().delete()
FAQ.objects.all().delete()
Review.objects.all().delete()
ProductImage.objects.all().delete()
Product.objects.all().delete()
Brand.objects.all().delete()
Category.objects.all().delete()

# Delete business user accounts from Keycloak & Django
print("Deleting business users & profiles...")
business_users = Customer.objects.filter(account_type="business")
for u in business_users:
    if u.keycloak_user_id:
        try:
            print(f"Deleting Keycloak user: {u.username} ({u.keycloak_user_id})")
            delete_keycloak_user(u.keycloak_user_id)
        except Exception as e:
            print(f"Failed to delete Keycloak user {u.username}: {e}")
    u.delete()

# Clean up any leftover seller profiles or seller models
SellerProfile.objects.all().delete()
Seller.objects.all().delete()

print("Cleanup completed successfully.")

print("=== STARTING SEEDING DATA ===")

# 1. Create Brands
print("Creating brands...")
brands_list = ["Apple", "Samsung", "Adidas", "Zara", "Organic India", "IKEA", "Chanel"]
brands = {}
for name in brands_list:
    brand, _ = Brand.objects.get_or_create(name=name)
    brands[name] = brand

# 2. Create Categories
print("Creating categories...")
categories_list = ["Electronics", "Fashion", "Groceries", "Home Decoration", "Beauty & Fragrances"]
categories = {}
for name in categories_list:
    cat, _ = Category.objects.get_or_create(name=name)
    categories[name] = cat

# 3. Create 5 Business Sellers
sellers_data = [
    {
        "email": "seller1@test.com",
        "first_name": "Vibrant",
        "last_name": "Tech",
        "name": "Vibrant Tech",
        "business_name": "Vibrant Tech Solutions",
        "reg_no": "REG123456",
        "address": "123 Technology Drive, Bangalore",
        "phone": "+919988776655"
    },
    {
        "email": "seller2@test.com",
        "first_name": "Aura",
        "last_name": "Fashion",
        "name": "Aura Fashion",
        "business_name": "Aura Apparel Group",
        "reg_no": "REG789101",
        "address": "45 Fashion Boulevard, Mumbai",
        "phone": "+919988776656"
    },
    {
        "email": "seller3@test.com",
        "first_name": "Fresh",
        "last_name": "Organic",
        "name": "Fresh Organic",
        "business_name": "Fresh Farms Organic Ltd",
        "reg_no": "REG112131",
        "address": "77 Greenfield Meadows, Pune",
        "phone": "+919988776657"
    },
    {
        "email": "seller4@test.com",
        "first_name": "Home",
        "last_name": "Decor",
        "name": "Home Decor",
        "business_name": "Modern Living & Decor",
        "reg_no": "REG415161",
        "address": "9 Craft Lane, Jaipur",
        "phone": "+919988776658"
    },
    {
        "email": "seller5@test.com",
        "first_name": "Elite",
        "last_name": "Fragrance",
        "name": "Elite Fragrance",
        "business_name": "Elite Scents and Beauty",
        "reg_no": "REG718192",
        "address": "22 Perfume Street, Delhi",
        "phone": "+919988776659"
    }
]

created_sellers = []

for sd in sellers_data:
    email = sd["email"]
    # Deleting keycloak user first if exists to prevent 409 conflict
    try:
        # Check if user already exists in keycloak (or check status)
        # We can try to delete to be safe
        import requests
        from Customer.keycloak import get_keycloak_admin_token, _admin_api_url, _headers
        token = get_keycloak_admin_token()
        search_res = requests.get(_admin_api_url("users"), params={"email": email}, headers=_headers(token), timeout=15)
        if search_res.status_code == 200 and len(search_res.json()) > 0:
            kc_id = search_res.json()[0]["id"]
            print(f"Leftover user {email} found in Keycloak. Deleting...")
            delete_keycloak_user(kc_id)
    except Exception as e:
        print(f"Keycloak pre-cleanup checks skipped for {email}: {e}")

    print(f"Creating Business User: {email}...")
    # Create in Keycloak
    keycloak_user_id = create_keycloak_user(
        username=email,
        email=email,
        first_name=sd["first_name"],
        last_name=sd["last_name"],
        password="SecurePass123!"
    )
    # Sync status to verified true in Keycloak
    update_keycloak_email_verified(keycloak_user_id, verified=True)
    
    # Create in Django
    customer = Customer.objects.create_user(
        username=email,
        email=email,
        password="SecurePass123!",
        first_name=sd["first_name"],
        last_name=sd["last_name"],
        name=sd["name"],
        phoneno=sd["phone"],
        account_type="business",
        is_verified=True,
        user_status="active",
        keycloak_user_id=keycloak_user_id
    )
    
    # Create SellerProfile
    profile = SellerProfile.objects.create(
        user=customer,
        business_name=sd["business_name"],
        business_registration_number=sd["reg_no"],
        business_email=email,
        business_phone=sd["phone"],
        business_address=sd["address"]
    )
    
    # Create Seller model (used in Product)
    seller_model = Seller.objects.create(
        name=sd["business_name"],
        rating=4.5,
        return_policy="30-day return policy",
        warranty="1 year warranty",
        total_sales=120,
        joined_date="2025-01-01",
        verified=True,
        description=f"Authorized dealer of premium products. {sd['business_name']}.",
        business_hours="9 AM - 6 PM",
        shipping_time="2-3 business days",
        location=sd["address"].split(",")[-1].strip()
    )
    
    created_sellers.append((customer, profile, seller_model))

# 4. Define Products Details
products_data = [
    # Seller 1: Electronics (10 products)
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Apple",
        "name": "iPhone 15 Pro Max", "price": 140000, "discount_price": 130000,
        "rating": 4.8, "stock": 25, "sku": "IP15PM-256",
        "image": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5",
        "description": "The latest Apple iPhone 15 Pro Max featuring a Titanium design, A17 Pro Chip, customizable Action button, and the most powerful iPhone camera system ever."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Apple",
        "name": "MacBook Air M3", "price": 115000, "discount_price": 109000,
        "rating": 4.7, "stock": 15, "sku": "MBA-M3-8G",
        "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
        "description": "Supercharged by the next-generation M3 chip, the incredibly thin and fast MacBook Air is designed for work and play with up to 18 hours of battery life."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Samsung Galaxy S24 Ultra", "price": 125000, "discount_price": 119000,
        "rating": 4.9, "stock": 20, "sku": "S24U-512",
        "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf",
        "description": "Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a flat 6.8-inch display, packed with Galaxy AI features."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Sony WH-1000XM5 Headset", "price": 30000, "discount_price": 27000,
        "rating": 4.6, "stock": 40, "sku": "SONY-XM5",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "description": "Industry-leading noise canceling overhead headphones with exceptional sound quality, smart features, and up to 30 hours of continuous wireless playback."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Apple",
        "name": "iPad Pro 11-inch", "price": 85000, "discount_price": 79000,
        "rating": 4.7, "stock": 18, "sku": "IPAD-PRO-11",
        "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
        "description": "The ultimate iPad experience. Featuring astonishing M2 performance, superfast wireless connections, and the advanced Liquid Retina display."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Apple",
        "name": "Apple Watch Series 9", "price": 42000, "discount_price": 39000,
        "rating": 4.5, "stock": 30, "sku": "AW-S9-45",
        "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1",
        "description": "Smarter, brighter, mightier. The Apple Watch Series 9 helps you stay connected, active, healthy, and safe. Features double tap gesture capability."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Galaxy Buds 2 Pro", "price": 15000, "discount_price": 12000,
        "rating": 4.4, "stock": 50, "sku": "BUDS2-PRO",
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
        "description": "Experience immersive, 24-bit Hi-Fi sound quality with intelligent Active Noise Cancellation (ANC), ergonomic design, and auto-switching connectivity."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Dell XPS 13 Laptop", "price": 135000, "discount_price": 129000,
        "rating": 4.6, "stock": 10, "sku": "DELL-XPS13",
        "image": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
        "description": "The smallest 13-inch laptop featuring a stunning 4-sided InfinityEdge display, built with premium materials for maximum durability and lightweight portability."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Logitech MX Master 3S", "price": 9500, "discount_price": 8500,
        "rating": 4.7, "stock": 35, "sku": "LOGI-MX3S",
        "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7",
        "description": "An iconic mouse remastered. Experience 8K DPI tracking on any surface, Quiet Click technology, and the hyper-fast MagSpeed electromagnetic scroll wheel."
    },
    {
        "seller_idx": 0, "category": "Electronics", "brand": "Samsung",
        "name": "Anker Soundcore Motion+", "price": 11000, "discount_price": 9900,
        "rating": 4.5, "stock": 45, "sku": "ANKER-M+",
        "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
        "description": "Ultra-wide frequency range Bluetooth speaker with Hi-Res Audio, rich bass, custom EQ, and IPX7 waterproof protection for your outdoor parties."
    },

    # Seller 2: Fashion (10 products)
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Zara",
        "name": "Zara Slim Fit T-Shirt", "price": 1999, "discount_price": 1499,
        "rating": 4.2, "stock": 100, "sku": "ZARA-TS-01",
        "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
        "description": "Comfortable slim-fit t-shirt made of 100% organic cotton. Features a crew neck, short sleeves, and a soft, breathable texture for daily wear."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Zara",
        "name": "Zara Denim Jeans", "price": 3999, "discount_price": 2999,
        "rating": 4.3, "stock": 80, "sku": "ZARA-JEANS-02",
        "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
        "description": "Classic five-pocket jeans made from durable stretch-denim fabric. Features a slim fit with tapered legs and a medium wash finish."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Adidas",
        "name": "Adidas Ultraboost Shoes", "price": 17999, "discount_price": 14999,
        "rating": 4.8, "stock": 40, "sku": "ADI-UB-03",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
        "description": "The ultimate running shoes with responsive Boost cushioning, Primeknit textile upper, and Continental rubber outsole for extraordinary traction."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Adidas",
        "name": "Adidas Originals Hoodie", "price": 5999, "discount_price": 4999,
        "rating": 4.5, "stock": 60, "sku": "ADI-HOOD-04",
        "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
        "description": "Classic streetwear essential featuring the iconic Adidas Trefoil logo, French terry cotton blend, drawstring hood, and roomy kangaroo pocket."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Zara",
        "name": "Zara Leather Jacket", "price": 7999, "discount_price": 6999,
        "rating": 4.6, "stock": 25, "sku": "ZARA-LE-05",
        "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5",
        "description": "Sleek and edgy faux-leather jacket featuring a lapel collar, asymmetric zip closure, zippered pockets, and structured shoulder detail."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Zara",
        "name": "Zara Summer Dress", "price": 3499, "discount_price": 2499,
        "rating": 4.4, "stock": 50, "sku": "ZARA-DRESS-06",
        "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8",
        "description": "Lightweight A-line summer dress featuring a floral print, V-neckline, thin adjustable shoulder straps, and a flowy tiered hemline."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Adidas",
        "name": "Adidas Sports Cap", "price": 1499, "discount_price": 999,
        "rating": 4.3, "stock": 120, "sku": "ADI-CAP-07",
        "image": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b",
        "description": "Classic structured baseball cap with moisture-wicking sweatband, pre-curved brim, and adjustable strapback closure for custom fit."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Adidas",
        "name": "Adidas Gym Bag", "price": 2999, "discount_price": 2499,
        "rating": 4.5, "stock": 70, "sku": "ADI-BAG-08",
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
        "description": "Durable medium-sized duffel bag featuring a ventilated side pocket for shoes, zippered main compartment, and padded shoulder straps."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Zara",
        "name": "Zara Woolen Scarf", "price": 1299, "discount_price": 999,
        "rating": 4.1, "stock": 90, "sku": "ZARA-SC-09",
        "image": "https://images.unsplash.com/photo-1520903074185-8ec362b907e3",
        "description": "Cozy, thick woolen scarf with long fringed details at both ends. Perfect accessory to keep you warm and stylish during cold seasons."
    },
    {
        "seller_idx": 1, "category": "Fashion", "brand": "Adidas",
        "name": "Adidas Crew Socks (3-Pack)", "price": 799, "discount_price": 599,
        "rating": 4.6, "stock": 150, "sku": "ADI-SOCK-10",
        "image": "https://images.unsplash.com/photo-1582966772680-860e372bb558",
        "description": "Cushioned crew socks designed for athletic training and casual wear. Features Arch support compression band and reinforced heels/toes."
    },

    # Seller 3: Groceries (10 products)
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Tulsi Green Tea", "price": 250, "discount_price": 220,
        "rating": 4.5, "stock": 150, "sku": "OI-TEA-01",
        "image": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12",
        "description": "A soothing blend of Tulsi (Holy Basil) and premium Green Tea. Rich in antioxidants to naturally boost immunity and energy levels."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Organic Honey (500g)", "price": 450, "discount_price": 399,
        "rating": 4.6, "stock": 110, "sku": "OI-HONEY-02",
        "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38",
        "description": "100% pure, raw, and organic forest honey. Sourced directly from wild hives, containing active enzymes and natural nutrients."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Cow Ghee (1L)", "price": 850, "discount_price": 799,
        "rating": 4.7, "stock": 90, "sku": "OI-GHEE-03",
        "image": "https://images.unsplash.com/photo-1605270812954-7cdcdf501400",
        "description": "Pure cow ghee made with traditional churned Bilona method. Excellent source of fat-soluble vitamins, with rich flavor and aroma."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Organic Quinoa (1kg)", "price": 350, "discount_price": 299,
        "rating": 4.4, "stock": 85, "sku": "OI-QUI-04",
        "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c",
        "description": "High-protein gluten-free supergrain quinoa. Packed with essential amino acids, dietary fibers, and minerals. Perfect healthy rice alternative."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Basmati Rice (5kg)", "price": 950, "discount_price": 850,
        "rating": 4.5, "stock": 70, "sku": "OI-RICE-05",
        "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c",
        "description": "Premium extra-long grain classic Basmati Rice. Aged to perfection, producing distinct aroma and fluffy, non-sticky texture when cooked."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Organic Almonds (250g)", "price": 400, "discount_price": 350,
        "rating": 4.6, "stock": 130, "sku": "OI-ALM-06",
        "image": "https://images.unsplash.com/photo-1508061253366-f7da158b6d46",
        "description": "Raw, unsalted premium California almonds. Rich in Vitamin E, healthy fats, and fiber. Ideal as a daily healthy snack."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Organic Chia Seeds (200g)", "price": 180, "discount_price": 150,
        "rating": 4.3, "stock": 140, "sku": "OI-CHIA-07",
        "image": "https://images.unsplash.com/photo-1511149755252-b5c60096530d",
        "description": "Raw, nutrient-dense organic chia seeds. High in Omega-3 fatty acids and soluble fiber. Perfect to mix in smoothies and puddings."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Turmeric Powder (200g)", "price": 120, "discount_price": 99,
        "rating": 4.6, "stock": 200, "sku": "OI-TUR-08",
        "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
        "description": "High-curcumin organic turmeric powder. Free from preservatives and chemicals. Known for its strong anti-inflammatory properties."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Coconut Oil (500ml)", "price": 300, "discount_price": 270,
        "rating": 4.5, "stock": 95, "sku": "OI-COCO-09",
        "image": "https://images.unsplash.com/photo-1622484211148-716598e04141",
        "description": "100% pure cold-pressed extra virgin organic coconut oil. Retains all natural nutrients. Perfect for cooking and hair/skin care."
    },
    {
        "seller_idx": 2, "category": "Groceries", "brand": "Organic India",
        "name": "Apple Cider Vinegar", "price": 450, "discount_price": 399,
        "rating": 4.4, "stock": 80, "sku": "OI-ACV-10",
        "image": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b",
        "description": "Raw, unfiltered organic Apple Cider Vinegar with the 'Mother' of vinegar. Boosts digestion, gut health, and weight management."
    },

    # Seller 4: Home Decoration (10 products)
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Ceramic Flower Vase", "price": 1499, "discount_price": 1199,
        "rating": 4.3, "stock": 60, "sku": "IKEA-VASE-01",
        "image": "https://images.unsplash.com/photo-1578500494198-246f612d3b3d",
        "description": "Modern minimalist white ceramic flower vase. Provides a clean and artistic decor accessory for living tables and shelves."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Table Desk Lamp", "price": 2499, "discount_price": 1999,
        "rating": 4.5, "stock": 50, "sku": "IKEA-LAMP-02",
        "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
        "description": "Elegant desk lamp with adjustable arm and warm LED bulb. Adds cozy illumination to study desks and bedside tables."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Persian Style Area Rug", "price": 8999, "discount_price": 7999,
        "rating": 4.7, "stock": 25, "sku": "IKEA-RUG-03",
        "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
        "description": "Traditional Persian-patterned woven area rug. Extremely soft underfoot, bringing warmth and color to living rooms and hallways."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Ergonomic Office Chair", "price": 12999, "discount_price": 10999,
        "rating": 4.6, "stock": 30, "sku": "IKEA-CHAIR-04",
        "image": "https://images.unsplash.com/photo-1505797149-43b0069ec26b",
        "description": "High-back mesh office chair featuring adjustable lumbar support, gas lift height adjustment, and smooth-rolling nylon casters."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Wooden Study Table", "price": 9999, "discount_price": 8499,
        "rating": 4.5, "stock": 20, "sku": "IKEA-TABLE-05",
        "image": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
        "description": "Spacious and sturdy engineered-wood study desk featuring a clean tabletop, built-in wire grommets, and side storage drawer."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Decorative Wall Mirror", "price": 3499, "discount_price": 2999,
        "rating": 4.4, "stock": 35, "sku": "IKEA-MIR-06",
        "image": "https://images.unsplash.com/photo-1618220179428-22790b461013",
        "description": "Stunning round wall mirror with an elegant metallic frame. Enhances depth and bounces light beautifully inside bedrooms."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Scented Candle Set", "price": 799, "discount_price": 599,
        "rating": 4.2, "stock": 100, "sku": "IKEA-CANDLE-07",
        "image": "https://images.unsplash.com/photo-1603006905003-be475563bc59",
        "description": "Three pack of soy wax scented candles (Vanilla, Lavender, Jasmine). Long-burning candles in stylish reusable glass jars."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Cotton Throw Pillow", "price": 999, "discount_price": 799,
        "rating": 4.4, "stock": 80, "sku": "IKEA-PILLOW-08",
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2",
        "description": "Soft decorative throw pillow with detailed woven cotton texture. Filled with hypoallergenic microfiber insert."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Artificial Potted Plant", "price": 1299, "discount_price": 999,
        "rating": 4.3, "stock": 70, "sku": "IKEA-PLANT-09",
        "image": "https://images.unsplash.com/photo-1545241047-6083a3684587",
        "description": "Lifelike artificial potted eucalyptus plant. Adds refreshing green decor accent without the maintenance of a real plant."
    },
    {
        "seller_idx": 3, "category": "Home Decoration", "brand": "IKEA",
        "name": "Metal Photo Frame", "price": 499, "discount_price": 399,
        "rating": 4.2, "stock": 110, "sku": "IKEA-FRAME-10",
        "image": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634",
        "description": "Sleek matte-black aluminum photo frame. Features a glass front and standback hook for tabletop or wall display."
    },

    # Seller 5: Beauty & Fragrances (10 products)
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Chanel No. 5 Parfum", "price": 12500, "discount_price": 11500,
        "rating": 4.8, "stock": 30, "sku": "CH-N5-01",
        "image": "https://images.unsplash.com/photo-1541643600914-78b084683601",
        "description": "The legendary Chanel No. 5 Eau de Parfum. A timeless, ultimate signature feminine fragrance featuring floral and aldehyde notes."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Chanel Coco Mademoiselle", "price": 13500, "discount_price": 12500,
        "rating": 4.9, "stock": 25, "sku": "CH-COCO-02",
        "image": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
        "description": "An elegant and spirited fragrance for women. Combines vibrant orange, jasmine, patchouli, and vetiver in a luxurious blend."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Rouge Allure Lipstick", "price": 3800, "discount_price": 3400,
        "rating": 4.5, "stock": 70, "sku": "CH-LIP-03",
        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa",
        "description": "Vibrant satin-finish luxury lipstick. Formulated with green tea, sweet almond oil, and high concentration pigments for comfort and color."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Hydra Beauty Gel Cream", "price": 6500, "discount_price": 5900,
        "rating": 4.6, "stock": 45, "sku": "CH-HYD-04",
        "image": "https://images.unsplash.com/photo-1608248597481-496100c8c836",
        "description": "Deeply hydrating gel-cream facial moisturizer. Formulated with Camellia Alba PFA to restore skin's optimal moisture balance."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Le Lift Eye Cream", "price": 8500, "discount_price": 7900,
        "rating": 4.5, "stock": 35, "sku": "CH-LIFT-05",
        "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19",
        "description": "Highly effective anti-aging lift eye cream. Smooths out wrinkles, reduces dark circles and puffiness around eye contours."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Bleu de Chanel", "price": 11000, "discount_price": 9900,
        "rating": 4.8, "stock": 40, "sku": "CH-BLEU-06",
        "image": "https://images.unsplash.com/photo-1523293182086-7651a899d37f",
        "description": "A tribute to masculine freedom. A woody, aromatic fragrance with cedar, sandalwood, and fresh citrus notes in a deep blue bottle."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Chance Eau Tendre", "price": 11500, "discount_price": 10500,
        "rating": 4.7, "stock": 30, "sku": "CH-CHANCE-07",
        "image": "https://images.unsplash.com/photo-1547887537-6158d64c35b3",
        "description": "A sweet, floral-fruity delicate fragrance. Features notes of quince, grapefruit, rose, jasmine, and white musk in a round bottle."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Sublimage Ultimate Cream", "price": 28000, "discount_price": 26000,
        "rating": 4.9, "stock": 15, "sku": "CH-SUB-08",
        "image": "https://images.unsplash.com/photo-1617897903246-719242758050",
        "description": "The ultimate anti-aging luxury skincare cream. Combines active Vanilla Planifolia molecules to regenerate skin elasticity and radiance."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Rouge Coco Gloss", "price": 2900, "discount_price": 2500,
        "rating": 4.4, "stock": 65, "sku": "CH-GLOSS-09",
        "image": "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10",
        "description": "Non-sticky, ultra-shiny moisturizing lip gloss. Glides on effortlessly, providing high-shine translucent color finish."
    },
    {
        "seller_idx": 4, "category": "Beauty & Fragrances", "brand": "Chanel",
        "name": "Inimitable Mascara", "price": 3200, "discount_price": 2900,
        "rating": 4.6, "stock": 55, "sku": "CH-MASC-10",
        "image": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
        "description": "Perfect definition mascara. Delivers volume, length, and curl to lashes with an innovative elastomer brush head."
    }
]

print("Creating products...")
for idx, pd in enumerate(products_data):
    seller_idx = pd["seller_idx"]
    customer, profile, seller_model = created_sellers[seller_idx]
    
    cat = categories[pd["category"]]
    br = brands[pd["brand"]]
    
    print(f"Creating product {idx+1}: {pd['name']} for {profile.business_name}...")
    
    Product.objects.create(
        name=pd["name"],
        description=pd["description"],
        price=pd["price"],
        discount_price=pd["discount_price"],
        rating=pd["rating"],
        stock=pd["stock"],
        category=cat,
        brand=br,
        seller=seller_model,
        seller_profile=profile,
        sku=pd["sku"],
        image=pd["image"],
        status=Product.STATUS_ACTIVE,
        is_featured=random.choice([True, False])
    )

print("=== SEEDING COMPLETED SUCCESSFULLY ===")

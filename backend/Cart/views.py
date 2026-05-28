# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from WishList.models import Wishlist, WishlistItem
from Product.models import Product


def get_default_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user, name="Default")
    return cart


def serialize_user_carts(user):
    carts = Cart.objects.filter(user=user).prefetch_related("items").order_by("created_at")
    return {"carts": CartSerializer(carts, many=True).data}


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        carts = Cart.objects.filter(user=request.user)
        serializer = CartSerializer(carts, many=True)
        return Response({"carts": serializer.data}, status=status.HTTP_200_OK)

    def create(self, request):
        name = request.data.get("name")
        if not name:
            return Response({"message": "Cart name is required"}, status=status.HTTP_400_BAD_REQUEST)


        cart = Cart.objects.create(user=request.user, name=name)
        return Response(
            {
                "message": "✅ New cart created successfully",
                "cart": {"id": cart.id, "name": cart.name, "items": []},
            },
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        cart = get_object_or_404(Cart, pk=pk, user=request.user)
        cart.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartItemViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request, cart_pk=None):
        # Get cart
        cart = get_object_or_404(Cart, pk=cart_pk, user=request.user)
        product_list = request.data.get("product")

        if not product_list or not isinstance(product_list, list):
            return Response({"message": "Invalid request. Product data missing or wrong format."}, status=status.HTTP_400_BAD_REQUEST)

        added_products = []

        for product in product_list:
            # Make sure product is a dict
            if not isinstance(product, dict):
                continue

            product_id = product.get("id")
            name = product.get("name")
            price = product.get("price")
            image = product.get("image", "")
            selected_options = product.get("selectedOptions", {})
            quantity = int(product.get("quantity", 1))

            if not product_id or not name or price is None:
                continue  # skip invalid product

            # Check if product already exists in cart
            existing_item = CartItem.objects.filter(cart=cart, product_id=product_id).first()
            if existing_item:
                existing_item.quantity += quantity
                existing_item.save()
                added_products.append({
                    "id": existing_item.product_id,
                    "name": existing_item.name,
                    "price": existing_item.price,
                    "quantity": existing_item.quantity,
                    "message": f"Quantity updated ✅ (x{existing_item.quantity})"
                })
                continue

            # Create new cart item
            item = CartItem.objects.create(
                cart=cart,
                product_id=product_id,
                name=name,
                price=price,
                image=image,
                selected_options=selected_options,
                quantity=quantity
            )

            added_products.append({
                "id": item.product_id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "message": "Product added ✅"
            })

        return Response({
            "message": "Products processed successfully ✅",
            "cart": str(cart.id),
            "products": added_products
        }, status=status.HTTP_200_OK)
    
    def destroy(self, request, cart_pk=None, pk=None):
        cart = get_object_or_404(Cart, pk=cart_pk, user=request.user)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)
        item.delete()
        return Response({"message": "Item removed from cart ✅"}, status=status.HTTP_204_NO_CONTENT)

    def update_quantity(self, request, pk=None, cart_pk=None):
        
        cart = get_object_or_404(Cart, pk=cart_pk, user=request.user)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)

        quantity = request.data.get("quantity")
        if quantity is None or int(quantity) <= 0:
            return Response({"message": "Quantity must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = int(quantity)
        item.save()

        return Response({
            "message": f"Quantity updated successfully ✅ (x{item.quantity})",
            "item": {
                "id": item.id,
                "product_id": item.product_id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity
            }
        }, status=status.HTTP_200_OK)

class MoveAllToCartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request, wishlist_pk=None):
        wishlist = get_object_or_404(Wishlist, pk=wishlist_pk, user=request.user)

        new_cart = Cart.objects.create(user=request.user, name=f"Cart from {wishlist.name}")
        wishlist_items = wishlist.product.all()

        for item in wishlist_items:
            CartItem.objects.create(
                cart=new_cart,
                product_id=item.product_id,
                name=item.name,
                price=item.price,
                image=item.image,
                selected_options=item.selected_options,
                quantity=1,
            )

        return Response(
            {
                "message": "All items from wishlist added to cart successfully ✅",
                "wishlistId": str(wishlist.id),
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_cart_list(request):
    return Response(serialize_user_carts(request.user), status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_cart_add(request):
    product_id = request.data.get("product_id") or request.data.get("id")
    quantity = int(request.data.get("quantity", 1) or 1)
    selected_options = request.data.get("selectedOptions") or request.data.get("selected_options") or {}
    cart_id = request.data.get("cart_id")

    if quantity <= 0:
        return Response({"detail": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

    product = Product.objects.filter(id=product_id).select_related("category", "brand").first()
    cart = get_object_or_404(Cart, id=cart_id, user=request.user) if cart_id else get_default_cart(request.user)

    if not product or product_id >= 100000000:
        name = request.data.get("name") or "Live Product"
        price = request.data.get("price") or 0.0
        image = request.data.get("image") or ""
        
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
            defaults={
                "name": name,
                "price": price,
                "quantity": quantity,
                "image": image,
                "selected_options": selected_options,
            },
        )
        if not created:
            item.quantity += quantity
            item.price = price
            item.selected_options = selected_options or item.selected_options
            item.save()
    else:
        if product.stock < quantity:
            return Response({"detail": "Requested quantity is not available."}, status=status.HTTP_400_BAD_REQUEST)

        main_image = product.thumbnail.url if product.thumbnail else product.image
        if not main_image:
            image_obj = product.images.filter(is_main=True).first() or product.images.first()
            if image_obj:
                main_image = image_obj.image.url if image_obj.image else image_obj.image_url

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product.id,
            defaults={
                "name": product.name,
                "price": product.discount_price or product.price,
                "quantity": quantity,
                "image": main_image or "",
                "selected_options": selected_options,
            },
        )
        if not created:
            item.quantity = min(product.stock, item.quantity + quantity)
            item.price = product.discount_price or product.price
            item.selected_options = selected_options or item.selected_options
            item.save()

    return Response({"message": "Product added to cart.", **serialize_user_carts(request.user)}, status=status.HTTP_200_OK)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def api_cart_update(request):
    item_id = request.data.get("item_id")
    product_id = request.data.get("product_id")
    quantity = int(request.data.get("quantity", 1) or 1)
    if quantity <= 0:
        return Response({"detail": "Quantity must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

    items = CartItem.objects.filter(cart__user=request.user)
    item = get_object_or_404(items, id=item_id) if item_id else get_object_or_404(items, product_id=product_id)
    product = Product.objects.filter(id=item.product_id).first()
    item.quantity = min(quantity, product.stock if product else quantity)
    item.save()
    return Response({"message": "Cart updated.", **serialize_user_carts(request.user)}, status=status.HTTP_200_OK)


@api_view(["DELETE", "POST"])
@permission_classes([IsAuthenticated])
def api_cart_remove(request):
    item_id = request.data.get("item_id")
    product_id = request.data.get("product_id")
    cart_id = request.data.get("cart_id")
    items = CartItem.objects.filter(cart__user=request.user)
    if cart_id:
        items = items.filter(cart_id=cart_id)
    item = get_object_or_404(items, id=item_id) if item_id else get_object_or_404(items, product_id=product_id)
    item.delete()
    return Response({"message": "Item removed.", **serialize_user_carts(request.user)}, status=status.HTTP_200_OK)

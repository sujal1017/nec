from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.shortcuts import get_object_or_404

from .models import Wishlist, WishlistItem
from .serializers import WishlistSerializer, WishlistItemSerializer, WishlistNameSerializer
from Cart.models import Cart, CartItem # ✅ import Cart model


# 1️⃣ GET /wishlist (All wishlists for the logged-in user)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    wishlists = Wishlist.objects.filter(user=request.user)
    serializer = WishlistNameSerializer(wishlists, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 🔥 NEW → GET /wishlistNames (Only wishlist names)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist_names_only(request):
    wishlists = Wishlist.objects.filter(user=request.user)
    serializer = WishlistNameSerializer(wishlists, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 2️⃣ UPDATED → GET /getWishListPage (Full wishlist details + user's carts)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist_page(request):
    wishlists = Wishlist.objects.filter(user=request.user)
    wish_serializer = WishlistSerializer(wishlists, many=True)

    # ✅ Get all user's carts (only id and name)
    carts = Cart.objects.filter(user=request.user).values("id", "name")
    carts_list = list(carts)

    return Response(
        {
            "wishlists": wish_serializer.data,
            "carts": carts_list,  # ✅ Added field
            "message": "Wishlist and cart data retrieved successfully ✅"
        },
        status=status.HTTP_200_OK
    )


# 3️⃣ POST /createNewWishlist
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_new_wishlist(request):
    name = request.data.get('name')
    if not name:
        return Response({"message": "Wishlist name is required"}, status=status.HTTP_400_BAD_REQUEST)

    if Wishlist.objects.filter(user=request.user, name=name).exists():
        return Response({"message": "Wishlist with same name already exists"}, status=status.HTTP_409_CONFLICT)

    wishlist = Wishlist.objects.create(user=request.user, name=name)
    return Response({
        "wishlist": {"id": wishlist.id, "name": wishlist.name, "createdAt": wishlist.created_at},
        "message": "Wishlist created successfully ✅"
    }, status=status.HTTP_201_CREATED)


# 4️⃣ POST /addToWishlist/{wishlistId}
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request, wishlistId):
    wishlist = get_object_or_404(Wishlist, id=wishlistId, user=request.user)
    serializer = WishlistItemSerializer(data=request.data.get('product'))

    if serializer.is_valid():
        serializer.save(wishlist=wishlist)
        return Response({
            "message": "Product added to wishlist successfully ✅",
            "wishlist": wishlistId,
            "product": serializer.data
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 5️⃣ DELETE /removeFromWishlist/{wishlistId}/{productId}
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request, wishlistId, productId):
    wishlist = get_object_or_404(Wishlist, id=wishlistId, user=request.user)
    product = get_object_or_404(WishlistItem, id=productId, wishlist=wishlist)
    product.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# 6️⃣ DELETE /deleteWishlist/{id}
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_wishlist(request, id):
    wishlist = get_object_or_404(Wishlist, id=id, user=request.user)
    wishlist.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class MoveWishlistToCartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request, wishlist_pk=None):
        """
        Move all items from a wishlist into a NEW cart (named after wishlist),
        then delete the wishlist and its items.
        """
        wishlist = get_object_or_404(Wishlist, pk=wishlist_pk, user=request.user)
        wishlist_items = WishlistItem.objects.filter(wishlist=wishlist)

        if not wishlist_items.exists():
            return Response(
                {"message": "No products found in wishlist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Create a new cart with wishlist name
        new_cart = Cart.objects.create(user=request.user, name=f"{wishlist.name}")

        moved_products = []

        # Move all wishlist items to the new cart
        for w_item in wishlist_items:
            item = CartItem.objects.create(
                cart=new_cart,
                product_id=w_item.id,
                name=w_item.name,
                price=w_item.price,
                image=w_item.image,
                selected_options=w_item.selected_options,
                quantity=1,
            )

            moved_products.append({
                "id": item.product_id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "message": "Moved to cart ✅"
            })

        # ✅ Delete wishlist and its items after successful move
        wishlist_items.delete()
        wishlist.delete()

        return Response(
            {
                "message": f"Wishlist '{new_cart.name}' moved to new cart successfully ✅",
                "cart": {"id": new_cart.id, "name": new_cart.name},
                "movedProducts": moved_products
            },
            status=status.HTTP_201_CREATED
        )
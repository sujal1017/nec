from django.urls import path
from .views import CartViewSet, CartItemViewSet, MoveAllToCartViewSet, api_cart_add, api_cart_list, api_cart_remove, api_cart_update

# Cart actions
cart_list = CartViewSet.as_view({"get": "list", "post": "create"})
cart_delete = CartViewSet.as_view({"delete": "destroy"})

# Cart item actions
cart_add_item = CartItemViewSet.as_view({"post": "create"})
cart_remove_item = CartItemViewSet.as_view({"delete": "destroy"})
cart_update_quantity = CartItemViewSet.as_view({"patch": "update_quantity"}) 
# Wishlist to cart
move_all_to_cart = MoveAllToCartViewSet.as_view({"post": "create"})

urlpatterns = [
    path("", api_cart_list, name="api-cart-list"),
    path("add/", api_cart_add, name="api-cart-add"),
    path("update/", api_cart_update, name="api-cart-update"),
    path("remove/", api_cart_remove, name="api-cart-remove"),
    path("getCartPage/", cart_list, name="get-cart-page"),
    path("addNewCart/", cart_list, name="add-new-cart"),
    path("removeCart/<int:pk>", cart_delete, name="remove-cart"),
    path("addToCart/<int:cart_pk>/", cart_add_item, name="add-to-cart"),
    path("removeFromCart/<int:cart_pk>/<int:pk>", cart_remove_item, name="remove-from-cart"),
    path("moveAllToCart/<int:wishlist_pk>/", move_all_to_cart, name="move-all-to-cart"),
    path("updateCartQuantity/<int:cart_pk>/<int:pk>", cart_update_quantity, name="update-cart-quantity"),
]

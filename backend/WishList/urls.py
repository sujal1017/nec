from django.urls import path
from . import views

urlpatterns = [
    path('wishlist', views.get_wishlist, name='wishlist'),  # default all wishlists (names)
    path('wishlistNames', views.get_wishlist_names_only, name='wishlistNames'),  # ✅ NEW endpoint
    path('getWishListPage', views.get_wishlist_page, name='getWishListPage'),
    path('createNewWishlist', views.create_new_wishlist, name='createNewWishlist'),
    path('addToWishlist/<int:wishlistId>', views.add_to_wishlist, name='addToWishlist'),
    path('removeFromWishlist/<int:wishlistId>/<int:productId>', views.remove_from_wishlist, name='removeFromWishlist'),
    path('deleteWishlist/<int:id>', views.delete_wishlist, name='deleteWishlist'),
    path('<int:wishlist_pk>/moveToNewCart', views.MoveWishlistToCartViewSet.as_view({'post': 'create'}), name='moveWishlistToNewCart'),
]


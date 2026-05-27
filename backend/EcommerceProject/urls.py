"""
URL configuration for EcommerceProject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from Product.views import BannersListView, CategoryListView, LandingContentView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('customer/', include('Customer.urls')),
    path('products/', include('Product.urls')),
    path('orders/', include('Orders.urls')),
    path("cart/", include("Cart.urls")),
    path("wishlist/", include("WishList.urls")),
    path("banners/", BannersListView.as_view()),
    path("api/landing/", LandingContentView.as_view()),
    path("api/categories/", CategoryListView.as_view()),
    path("api/products/", include("Product.urls")),
    path("api/seller/", include("Seller.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProductListView, ProductRetrieveView


urlpatterns = [
    path("", ProductListView.as_view()),
    path("<int:pk>/", ProductRetrieveView.as_view()),
]


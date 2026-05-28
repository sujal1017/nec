from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ProductCompareView,
    ProductListView,
    ProductRecommendationView,
    ProductRetrieveView,
    RecentlyViewedView,
    SearchHistoryView,
    SearchMetaView,
    SearchSuggestionView,
    TrendingSearchView,
)


urlpatterns = [
    path("suggestions/", SearchSuggestionView.as_view()),
    path("search/meta/", SearchMetaView.as_view()),
    path("search/history/", SearchHistoryView.as_view()),
    path("search/trending/", TrendingSearchView.as_view()),
    path("recently-viewed/", RecentlyViewedView.as_view()),
    path("compare/", ProductCompareView.as_view()),
    path("<int:pk>/recommendations/", ProductRecommendationView.as_view()),
    path("", ProductListView.as_view()),
    path("<int:pk>/", ProductRetrieveView.as_view()),
]


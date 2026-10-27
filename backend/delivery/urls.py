from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryListView, OrderViewSet, ProductViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("", include(router.urls)),
]

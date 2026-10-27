from rest_framework import mixins, viewsets
from rest_framework.generics import ListAPIView

from .models import Category, Order, Product
from .serializers import (
    CategorySerializer,
    OrderCreateSerializer,
    OrderReadSerializer,
    ProductSerializer,
)


class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = Product.objects.select_related("category").filter(available=True)
        category = self.request.query_params.get("category")
        if category and category != "all":
            qs = qs.filter(category__slug=category)
        return qs


class OrderViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin,
                   viewsets.GenericViewSet):
    queryset = Order.objects.prefetch_related("items")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderReadSerializer

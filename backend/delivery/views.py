from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import routing
from .models import Category, Order, Product
from .serializers import (
    CategorySerializer,
    OrderCreateSerializer,
    OrderReadSerializer,
    ProductSerializer,
)

# An order can still be called off while it's being prepared, but not once the
# rider has left (or it's already delivered/cancelled).
CANCELLABLE_STATUSES = {Order.Status.PENDING, Order.Status.CONFIRMED}


class CategoryListView(ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class DeliveryQuoteView(APIView):
    """Live delivery eligibility + fee for a drop-off. Used by checkout as the pin
    moves / the cart changes. The authoritative re-check happens again on order create."""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        try:
            subtotal = int(data.get("subtotal") or 0)
            lat = data.get("lat")
            lng = data.get("lng")
            lat = float(lat) if lat not in (None, "") else None
            lng = float(lng) if lng not in (None, "") else None
        except (TypeError, ValueError):
            return Response({"detail": "Invalid location or subtotal."},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response(routing.quote(subtotal, lat, lng))


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

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == Order.Status.CANCELLED:
            return Response(self.get_serializer(order).data)
        if order.status not in CANCELLABLE_STATUSES:
            return Response(
                {"detail": f"This order can no longer be cancelled (it is {order.get_status_display().lower()})."},
                status=status.HTTP_409_CONFLICT,
            )
        reason = (request.data.get("reason") or "").strip()
        order.status = Order.Status.CANCELLED
        if reason:
            note = f"Cancelled by customer: {reason}"
            order.note = f"{order.note}\n{note}".strip() if order.note else note
        order.save(update_fields=["status", "note", "updated_at"])
        return Response(OrderReadSerializer(order).data)

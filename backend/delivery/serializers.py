from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from . import routing
from .models import Category, Order, OrderItem, Product


class CategorySerializer(serializers.ModelSerializer):
    count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "count"]


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "category", "category_slug",
            "price", "volume", "stock", "available", "in_stock",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "name", "unit_price", "quantity", "line_total"]


class OrderItemInputSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    cancellable = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "customer_name", "phone", "address", "note",
            "lat", "lng", "distance_km", "fee_breakdown",
            "status", "status_label", "cancellable",
            "subtotal", "delivery_fee", "total",
            "items", "created_at", "updated_at",
        ]

    def get_cancellable(self, obj):
        return obj.status in (Order.Status.PENDING, Order.Status.CONFIRMED)


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)
    lat = serializers.FloatField(write_only=True)
    lng = serializers.FloatField(write_only=True)

    class Meta:
        model = Order
        fields = ["customer_name", "phone", "address", "note", "lat", "lng", "items"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Your cart is empty.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        lat = validated_data.pop("lat")
        lng = validated_data.pop("lng")

        ids = [row["product"] for row in items_data]
        products = {p.id: p for p in Product.objects.filter(id__in=ids)}
        missing = [pid for pid in ids if pid not in products]
        if missing:
            raise serializers.ValidationError({"items": f"Unknown product id(s): {missing}"})

        # Compute subtotal from authoritative prices, then price delivery server-side.
        # Never trust a client-supplied fee: we re-run the quote and reject anything that
        # isn't orderable (below minimum / outside the delivery area).
        subtotal = sum(products[r["product"]].price * r["quantity"] for r in items_data)
        q = routing.quote(subtotal, lat, lng)
        if not q["orderable"]:
            raise serializers.ValidationError({"detail": q["reason"], "quote": q})

        distance_km = q["distance_km"]
        fee = q["delivery_fee"]
        order = Order.objects.create(
            lat=lat, lng=lng, distance_km=distance_km,
            delivery_fee=fee,
            fee_breakdown={
                "base": settings.DELIVERY_BASE_FEE,
                "distance_km": distance_km,
                "per_km": settings.DELIVERY_PER_KM,
                "free_km": settings.DELIVERY_FREE_KM,
                "value_rate": settings.DELIVERY_VALUE_RATE,
                "total_fee": fee,
            },
            **validated_data,
        )
        for row in items_data:
            product = products[row["product"]]
            OrderItem.objects.create(
                order=order,
                product=product,
                name=product.name,
                unit_price=product.price,
                quantity=row["quantity"],
            )
        order.recalculate()
        order.save(update_fields=["subtotal", "total"])
        return order

    def to_representation(self, instance):
        return OrderReadSerializer(instance, context=self.context).data

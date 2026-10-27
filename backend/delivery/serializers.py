from django.conf import settings
from django.db import transaction
from rest_framework import serializers

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

    class Meta:
        model = Order
        fields = [
            "id", "customer_name", "phone", "address", "note",
            "status", "status_label", "subtotal", "delivery_fee", "total",
            "items", "created_at", "updated_at",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["customer_name", "phone", "address", "note", "items"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Your cart is empty.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        ids = [row["product"] for row in items_data]
        products = {p.id: p for p in Product.objects.filter(id__in=ids)}

        missing = [pid for pid in ids if pid not in products]
        if missing:
            raise serializers.ValidationError(
                {"items": f"Unknown product id(s): {missing}"}
            )

        order = Order.objects.create(
            delivery_fee=settings.DELIVERY_FEE, **validated_data
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

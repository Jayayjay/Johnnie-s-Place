from django.contrib import admin

from .models import Category, Order, OrderItem, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "volume", "stock", "available"]
    list_filter = ["category", "available"]
    search_fields = ["name"]
    list_editable = ["price", "stock", "available"]
    prepopulated_fields = {"slug": ["name"]}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["name", "unit_price", "quantity", "line_total"]

    def line_total(self, obj):
        return obj.line_total


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer_name", "phone", "status", "total", "created_at"]
    list_filter = ["status", "created_at"]
    list_editable = ["status"]
    search_fields = ["customer_name", "phone", "id"]
    inlines = [OrderItemInline]
    readonly_fields = ["subtotal", "total", "created_at", "updated_at"]

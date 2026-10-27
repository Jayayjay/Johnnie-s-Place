from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    sort = models.PositiveSmallIntegerField(default=100)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["sort", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.CASCADE
    )
    # Price in whole Tanzanian Shillings (TZS).
    price = models.PositiveIntegerField()
    volume = models.CharField(max_length=24, blank=True)
    stock = models.IntegerField(default=0)
    available = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__sort", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def in_stock(self):
        return self.available and self.stock > 0

    def __str__(self):
        return self.name


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32)
    address = models.TextField()
    note = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    subtotal = models.PositiveIntegerField(default=0)
    delivery_fee = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def recalculate(self):
        self.subtotal = sum(item.line_total for item in self.items.all())
        self.total = self.subtotal + self.delivery_fee

    def __str__(self):
        return f"Order #{self.pk} — {self.customer_name} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    # Snapshot name/price so the order is stable even if the catalog changes.
    name = models.CharField(max_length=160)
    unit_price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.name}"

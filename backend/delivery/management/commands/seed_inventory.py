"""Load data/inventory.json into Category + Product rows.

Idempotent: categories and products are upserted by name/slug, so re-running
refreshes prices and stock without creating duplicates. Run after migrate:

    python manage.py seed_inventory
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from delivery.models import Category, Product

DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "inventory.json"

# Display order for the shop's category rail.
CATEGORY_SORT = {
    "Beer & Cider": 10,
    "Wine": 20,
    "Whisky": 30,
    "Brandy & Cognac": 40,
    "Rum": 50,
    "Vodka": 60,
    "Gin & Local Spirits": 70,
    "Liqueur": 80,
    "Soft & Energy": 90,
    "Other": 100,
}


class Command(BaseCommand):
    help = "Seed the drink catalog from data/inventory.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush", action="store_true",
            help="Delete existing products and categories before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f"Missing {DATA_FILE}. Run scripts/extract_inventory.py first."))
            return

        if options["flush"]:
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write("Flushed existing catalog.")

        rows = json.loads(DATA_FILE.read_text())
        categories = {}
        created, updated = 0, 0

        for row in rows:
            cat_name = row["category"]
            category = categories.get(cat_name)
            if category is None:
                category, _ = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={
                        "slug": slugify(cat_name),
                        "sort": CATEGORY_SORT.get(cat_name, 100),
                    },
                )
                categories[cat_name] = category

            slug = slugify(row["name"])
            obj, was_created = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": row["name"],
                    "category": category,
                    "price": row["price"],
                    "volume": row.get("volume", ""),
                    "stock": row.get("stock", 0),
                    "available": True,
                },
            )
            created += was_created
            updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(rows)} items across {len(categories)} categories "
            f"({created} created, {updated} updated)."
        ))

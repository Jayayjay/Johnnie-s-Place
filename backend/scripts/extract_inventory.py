"""One-off extractor: Apple Numbers bar inventory -> backend/data/inventory.json.

Reads the user's "Bar invontory with formulas 2.numbers" file, flattens every
sheet/table, and emits a clean catalog of {name, price, stock, category, volume}.
Category and volume are inferred from the item name. Run once to (re)generate the
seed file consumed by the seed_inventory management command.
"""

import json
import re
import sys
from pathlib import Path

from numbers_parser import Document

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent
REPO = BACKEND.parent.parent  # .../Bar
SOURCE = REPO / "assets" / "Bar invontory with formulas 2.numbers"
OUT = BACKEND / "data" / "inventory.json"

# Keyword -> category rules, checked in order (first match wins).
CATEGORY_RULES = [
    ("Whisky", ["whisk", "jack daniel", "johnnie", "grants", "grant's", "black & white",
                "black and white", "hanson", "justerini", "scotch", "bourbon"]),
    ("Brandy & Cognac", ["hennessy", "camino real", "brandy", "cognac", "valeur"]),
    ("Rum", ["bacardi", "captain morgan", "rum"]),
    ("Vodka", ["vodka", "cuca", "double kick", "smirnoff"]),
    ("Gin & Local Spirits", ["konyagi", "k vant", "kvant", "gin"]),
    ("Liqueur", ["amarula", "liqueur", "cream", "jagermeister", "zanzi"]),
    ("Wine", ["wine", "pearly bay", "robertson", "dodoma", "droddy", "barapo",
              "four cousins", "saint anna", "dompo", "sweet red", "dry red",
              "dry white", "white wine", "red wine"]),
    ("Beer & Cider", ["heineken", "desperados", "savanna", "brutal", "flying fish",
                      "kilimanjaro", "guinness", "safari", "castle", "serengeti",
                      "pilsner", "lager", "beer", "cider", "stout", "spritzer"]),
    ("Soft & Energy", ["redbull", "red bull", "azam", "energy", "coca", "cola",
                       "sprite", "water", "soda", "juice", "drink"]),
]

VOLUME_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(ml|cl|l)\b", re.IGNORECASE)


def infer_category(name: str) -> str:
    low = name.lower()
    for category, keywords in CATEGORY_RULES:
        if any(k in low for k in keywords):
            return category
    return "Other"


def infer_volume(name: str) -> str:
    m = VOLUME_RE.search(name)
    if not m:
        return ""
    value, unit = m.group(1), m.group(2).lower()
    return f"{value}{unit}"


def to_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return None


def main():
    if not SOURCE.exists():
        sys.exit(f"Source not found: {SOURCE}")

    doc = Document(str(SOURCE))
    items = {}
    skip_markers = {"item", "items in the store", "total", "stock value", "price"}

    for sheet in doc.sheets:
        for table in sheet.tables:
            rows = table.rows(values_only=True)
            for row in rows:
                if not row:
                    continue
                name = (row[0] or "").strip() if isinstance(row[0], str) else None
                if not name:
                    continue
                if name.lower() in skip_markers:
                    continue
                price = to_number(row[1]) if len(row) > 1 else None
                if price is None or price <= 0:
                    continue
                stock = None
                # Current stock is typically the 2nd-to-last numeric column; fall back to any.
                for cell in row[2:]:
                    n = to_number(cell)
                    if n is not None:
                        stock = n
                # Keep the richest record if an item repeats across tables.
                existing = items.get(name)
                record = {
                    "name": name,
                    "price": int(round(price)),
                    "stock": int(stock) if stock is not None else 0,
                    "category": infer_category(name),
                    "volume": infer_volume(name),
                }
                if existing is None or record["stock"] > existing["stock"]:
                    items[name] = record

    catalog = sorted(items.values(), key=lambda r: (r["category"], r["name"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False))

    by_cat = {}
    for r in catalog:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    print(f"Wrote {len(catalog)} items to {OUT}")
    for cat, n in sorted(by_cat.items()):
        print(f"  {cat}: {n}")


if __name__ == "__main__":
    main()

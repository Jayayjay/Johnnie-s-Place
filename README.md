# Johnnie's Place

A moody neighbourhood bar and bottle shop with a **scroll-driven 3D landing page**
and a **drink delivery service**. Built from the Casa Barbero frontend template,
rebranded for a bar, with a real catalog seeded from the house inventory.

- **Frontend** — React 18 + Vite single-page app. Cinematic landing page with a
  three.js / react-three-fiber bottle showcase, plus a shop → cart → checkout →
  order-tracking flow.
- **Backend** — Django + Django REST Framework delivery API (products, categories,
  orders, order status). Catalog seeded from the owner's Apple Numbers stock sheet.

Prices are in **Tanzanian Shillings (TZS)**.

## Tech stack

| Concern            | Tool |
|--------------------|------|
| Frontend framework | React 18, Vite 6 |
| 3D                 | three.js, @react-three/fiber, @react-three/drei |
| Routing / motion   | react-router-dom, motion, lucide-react |
| Backend API        | Django 6, Django REST Framework |
| Database (dev)     | SQLite |
| Cross-origin       | django-cors-headers |
| Catalog source     | Apple Numbers → `numbers-parser` |

## Repo layout

```
Johnnie's Place/
  frontend/                 React + Vite SPA
    public/models/          optimised GLB bottles (self-contained, WebP textures)
    src/
      components/           landing sections + Bottle3D (the WebGL showcase)
      pages/                MenuPage, CartPage, CheckoutPage, OrderTrackPage, errors/
      context/CartContext   cart state (localStorage-persisted)
      services/api.js       fetch wrapper (VITE_API_URL)
      utils/format.js       formatTZS()
  backend/                  Django delivery service
    config/                 settings, urls, wsgi/asgi
    delivery/               models, serializers, views, urls, admin
      management/commands/seed_inventory.py
    data/inventory.json     extracted catalog (60 drinks, 9 categories)
    scripts/extract_inventory.py   Numbers -> inventory.json
```

## Run locally

Two servers on fixed, non-colliding ports: **Vite on 5174**, **Django on 8000**.

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env                       # adjust if needed
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_inventory  # loads data/inventory.json
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

Optional — regenerate the catalog from the source spreadsheet:

```bash
.venv/bin/python scripts/extract_inventory.py   # writes data/inventory.json
.venv/bin/python manage.py seed_inventory        # re-seed (idempotent)
```

Create an admin user to manage orders / advance delivery status:

```bash
.venv/bin/python manage.py createsuperuser   # then visit /admin/
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps   # drei pulls optional Expo peers; this skips them
cp .env.example .env.local
npm run dev                       # http://localhost:5174
```

## API

Base URL: `http://localhost:8000/api`

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/categories/`          | List categories with product counts |
| GET  | `/products/`            | List available products (`?category=<slug>` to filter) |
| GET  | `/products/<slug>/`     | Single product |
| POST | `/orders/`              | Create an order (see body below) |
| GET  | `/orders/<id>/`         | Retrieve an order (used by order tracking) |

Create-order body:

```json
{
  "customer_name": "Amina Juma",
  "phone": "+255744112233",
  "address": "7 Msasani Peninsula, Dar es Salaam",
  "note": "Gate code 4521",
  "items": [{ "product": 40, "quantity": 1 }, { "product": 2, "quantity": 3 }]
}
```

The server snapshots each item's name and price, applies the flat `DELIVERY_FEE`,
and returns the order with computed `subtotal` / `delivery_fee` / `total`.
Order status flows **pending → confirmed → out_for_delivery → delivered**
(advance it from the Django admin); the tracking page polls `/orders/<id>/`.

## 3D showcase

`src/components/Bottle3D.jsx` renders a fixed WebGL layer behind the hero. As the
page scrolls the camera orbits and dollies around the bottle shelf — the react
analogue of the WebGI/GSAP scroll stages in the reference project. It lazy-loads
three.js, and falls back to a lightweight CSS glow on reduced-motion or small
touch screens.

The GLB models in `public/models/` were optimised from the raw 19 MB / 65 MB source
assets with `@gltf-transform/cli` (textures resized to 1024² and re-encoded as WebP,
no Draco so no external decoder is needed): `bottles.glb` is ~440 KB, `wine_bottle.glb`
~256 KB.

## Notes

- Dev-grade: SQLite and no payment gateway — checkout records an order and the
  customer pays cash / mobile money on delivery.
- Currency is centralised in `frontend/src/utils/format.js` (`formatTZS`) and
  `DELIVERY_FEE` in both `config.js` and backend settings.
- 18+ only. Please drink responsibly.
```

# Activity Log

Format: date — summary — decision/outcome.

## 2026-10-27 — Initial build: Johnnie's Place bar site + delivery service

Built the full project in `Johnnie's Place/` from the `Casa_Barbero` frontend
template, rebranded for a bar, with a 3D bottle showcase and a Django delivery API.

**Decisions**
- 3D engine: **react-three-fiber + drei** (not WebGI). WebGI is a licensed,
  vanilla-TS bundle that doesn't fit the React template; r3f is the React-native
  equivalent of the `3D-Jewelry-webgi` reference.
- Backend: **Django + DRF** (per request) as the delivery service; SQLite for dev.
- Currency: **TZS** — inferred from the inventory's East-African brands and price
  magnitudes. Centralised in `formatTZS()` so it's a one-line change.
- Frontend stack pinned to **React 18 + r3f 8 + drei 9 + three 0.171** (battle-tested
  combo). `npm install` needs `--legacy-peer-deps` because drei lists optional Expo peers.

**Assets**
- `assets/20_liquor_bottles.glb` (65 MB) — too heavy for web, ignored.
- `assets/20_liquor_bottles(1).glb` (19 MB) — optimised to `bottles.glb` (~440 KB).
- `assets/wine_bottle.glb` (0.7 MB) — optimised to `wine_bottle.glb` (~256 KB).
- Optimisation: `@gltf-transform/cli` texture resize 1024² + WebP, **no Draco**
  (keeps the files self-contained — EXT_texture_webp is decoded natively by three,
  so no CDN decoder is pulled at runtime).
- `assets/Bar invontory with formulas 2.numbers` → `backend/data/inventory.json`
  via `scripts/extract_inventory.py` (`numbers-parser`): **60 drinks, 9 categories**
  (categories inferred from item names). Konyagi / K Vant mapped to "Gin & Local Spirits".

**Verification (end-to-end)**
- Backend: migrate + seed OK (60 items). `GET /categories`, `GET /products?category=`,
  `POST /orders` (totals correct: subtotal + 3,000 fee), `GET /orders/<id>`, and
  status progression (pending → out_for_delivery) all verified via curl. Invalid id → 404,
  empty cart → 400.
- Frontend: `npm run build` transforms 2543 modules cleanly; dev server serves the SPA;
  CORS from :5174 → :8000 verified; `/models/bottles.glb` served. 3D chunk is lazy-loaded
  (~243 KB gzipped).
- Not browser-screenshotted this session (extension skipped by request); the production
  build compiling every component/page is the import/JSX correctness gate.

**Fix — blank page on first view**
- Symptom: `localhost:5174` rendered a blank black screen (React never mounted).
- Cause: Vite's dependency pre-bundle cache went stale after the dev server ran
  across many edits → `504 (Outdated Optimize Dep)` for three/fiber/drei → the lazy
  `Bottle3D` dynamic import rejected. With no error boundary around it, the whole
  React tree crashed to blank.
- Fix: (1) added `components/ErrorBoundary.jsx` around the lazy 3D in `Hero.jsx` so a
  3D load/WebGL failure degrades to the static fallback instead of blanking the app;
  (2) restarted Vite after `rm -rf node_modules/.vite`. Verified headlessly: home
  mounts (nav + hero + sections), `/menu` renders 60 cards with TZS prices and filter
  chips. (A "WebGL context" error appears only under headless Chromium with no GPU —
  the boundary catches it; real browsers with a GPU render the 3D.)

**Fix — 3D rendered but invisible**
- Symptom: page loaded but the bottle shelf wasn't visible.
- Causes: (1) the glass bottles use `KHR_materials_transmission` and rendered
  near-black with no environment map + weak lights; (2) reduced-motion users were
  skipped entirely (plain glow only).
- Fix in `Bottle3D.jsx`: added a local drei `<Environment>` (inline `<Lightformer>`s,
  no CDN) so the glass catches highlights, boosted the key/spot/point lights, scaled
  the shelf up and reframed the camera, and now render a *static* 3D scene for
  reduced-motion instead of nothing (only true small-touch screens get the CSS
  fallback). Verified by headless screenshot (software WebGL) — the full shelf
  (Jack Daniel's, Absolut, Baileys, Jägermeister, wines…) renders bright and centred-right.

**Tweaks — hero bottle + drinks grid**
- Hero asset swapped to `wine_bottle.glb` (single bottle). Retuned framing for one
  bottle: `TARGET_SIZE` 7, `LOOK_X -2.8 / LOOK_Y 0`, spin raised to 0.5 rad/s.
- Added **cursor interaction**: a window `mousemove` listener feeds a normalised
  pointer into the spin — the bottle keeps auto-rotating and leans/yaws toward the
  cursor (damped). Listener is on `window`, not the canvas, so it never blocks the
  hero buttons.
- Signature (Drinks) section: grid is now a fixed **3×2** (`repeat(3,1fr)`, 6 featured
  drinks), collapsing to 2 then 1 column on narrow screens.

**Tweaks — real room photos + mobile bottle tilt + mobile 3D**
- Mobile: the 3D was being skipped on small touch screens; now always rendered.
  Added responsive framing (DESKTOP vs MOBILE presets) so the bottle is centred and
  sized to fit a narrow viewport.
- Mobile bottle is now **tilted** (~18° lean via `MOBILE.tilt`): the spinning group
  is wrapped in an outer tilt group so it rotates cleanly about its own tilted axis.
- "The Room" gallery now uses the four real photos the user supplied in
  `assets/images/` — converted to WebP (max 1100px, q80, ~468 KB total) into
  `frontend/public/images/room/` (shelf-warm, cocktails-lineup, cocktails-bar,
  shelf-neon). Gallery rewritten for 4 portrait tiles (3:4), 4-up → 2x2 → 1-col,
  with a hover sheen. Replaced the old Unsplash landscape grid.

**Follow-ups / out of scope**
- Payment gateway (currently pay-on-delivery only).
- Real room photography (gallery uses Unsplash placeholders).
- Postgres + hosting config for production.

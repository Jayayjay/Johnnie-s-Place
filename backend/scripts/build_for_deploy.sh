#!/usr/bin/env bash
# Prepare the single-app deploy: build the SPA, bundle it next to the backend, and
# collect Django admin static. Run before committing/pushing to Vercel.
#
#   bash scripts/build_for_deploy.sh
#
# Then commit backend/spa/ + backend/staticfiles/ and push (Vercel's Python builder
# won't run npm, so the built output must be committed).
set -euo pipefail

BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$(cd "$BACKEND/.." && pwd)/frontend"

echo "==> Building frontend (npm run build)…"
( cd "$FRONTEND" && npm run build )

echo "==> Bundling dist → backend/spa …"
rm -rf "$BACKEND/spa"
cp -r "$FRONTEND/dist" "$BACKEND/spa"

echo "==> Collecting Django static (admin) …"
PY="$BACKEND/.venv/bin/python"; [ -x "$PY" ] || PY=python
"$PY" "$BACKEND/manage.py" collectstatic --noinput

echo "==> Done. Commit backend/spa/ and backend/staticfiles/, then push."

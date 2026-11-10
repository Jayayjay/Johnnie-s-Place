"""Vercel serverless entry point — exposes the Django WSGI app.

The entrypoint lives in api/, so the backend root (its parent) isn't on sys.path by
default and `config` wouldn't import. Add it explicitly, then boot Django.
"""
import os
import sys
from pathlib import Path

# Backend root (parent of this api/ folder) → importable `config`, `delivery`, `accounts`.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from config.wsgi import application

# Vercel's @vercel/python runtime serves this WSGI callable.
app = application

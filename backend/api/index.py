"""Vercel serverless entry point — exposes the Django WSGI app.

Set the Vercel project's Root Directory to this backend folder so `config` is importable.
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from config.wsgi import application

# Vercel's @vercel/python runtime serves this WSGI callable.
app = application

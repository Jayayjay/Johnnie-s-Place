"""Django settings for the Johnnie's Place delivery service."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.getenv(name, str(default)).lower() in ("1", "true", "yes", "on")


def env_list(name, default=""):
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = env_bool("DEBUG", True)
# ".vercel.app" matches any Vercel subdomain (covers the backend deployment host).
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,.vercel.app")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "delivery",
    "accounts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# SQLite locally; on Vercel (ephemeral/read-only FS) set DATABASE_URL to an external
# Postgres (e.g. a free Neon database) and it's used instead.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
_db_url = os.getenv("DATABASE_URL")
if _db_url:
    import dj_database_url
    DATABASES["default"] = dj_database_url.parse(_db_url, conn_max_age=600, ssl_require=True)

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "Africa/Dar_es_Salaam")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "120/min"},
}
if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
        "rest_framework.renderers.BrowsableAPIRenderer"
    )

# CORS — the Vite dev server (5174) and the deployed frontend talk to this API.
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5174,http://127.0.0.1:5174,https://johnnie-s-pubf.vercel.app",
)
# Trust Vercel subdomains for CSRF (needed for the Django admin over HTTPS).
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "https://*.vercel.app")
# Behind Vercel's proxy, trust the forwarded protocol so HTTPS is detected.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Delivery pricing + eligibility (all TZS / km, env-tunable). The fee is computed per
# order from road distance and subtotal; online ordering is gated by MIN_ONLINE_ORDER
# and the serviceable area (see delivery/pricing.py and delivery/routing.py).
MIN_ONLINE_ORDER   = int(os.getenv("MIN_ONLINE_ORDER", "50000"))   # below this → WhatsApp only
MAX_DELIVERY_KM    = float(os.getenv("MAX_DELIVERY_KM", "25"))     # beyond this → not serviceable
DELIVERY_BASE_FEE  = int(os.getenv("DELIVERY_BASE_FEE", "3000"))
DELIVERY_PER_KM    = int(os.getenv("DELIVERY_PER_KM", "1200"))
DELIVERY_FREE_KM   = float(os.getenv("DELIVERY_FREE_KM", "2"))     # first N km included in base
DELIVERY_VALUE_RATE = float(os.getenv("DELIVERY_VALUE_RATE", "0.02"))  # fraction of subtotal added

# Google OAuth: the Web client ID from Google Cloud Console. The frontend uses the
# same value (VITE_GOOGLE_CLIENT_ID) to render the Sign in with Google button; the
# backend verifies the returned ID token was issued for this client.
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

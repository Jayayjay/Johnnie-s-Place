from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from django.urls import include, path, re_path


def health(_request):
    # DB-free liveness check — confirms the serverless function booted.
    return JsonResponse({"status": "ok", "service": "johnnies-pub-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("delivery.urls")),
]

# Serve the built React SPA for every non-API/non-admin/non-static route so client-side
# routing (and deep-link refresh) works. WhiteNoise serves the real files (assets, images,
# models, index at "/") before this; the catch-all only handles file-less app routes.
# index.html is read per request so the dev build-watch's new asset hashes are picked up.
_INDEX = Path(settings.FRONTEND_DIST) / "index.html"
if _INDEX.is_file():
    def spa_index(_request):
        try:
            return HttpResponse(_INDEX.read_bytes(), content_type="text/html")
        except OSError:
            return HttpResponseServerError("Frontend build not available.")

    urlpatterns += [
        re_path(r"^(?!api/|admin/|static/).*$", spa_index),
    ]

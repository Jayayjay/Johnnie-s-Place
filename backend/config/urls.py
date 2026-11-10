from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    # DB-free liveness check — confirms the serverless function booted.
    return JsonResponse({"status": "ok", "service": "johnnies-pub-api"})


urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("delivery.urls")),
]

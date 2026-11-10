from django.urls import path

from . import views

urlpatterns = [
    path("google/", views.google_auth, name="auth-google"),
    path("me/", views.me, name="auth-me"),
    path("logout/", views.logout, name="auth-logout"),
]

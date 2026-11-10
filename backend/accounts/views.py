"""Google Sign-In: verify a Google ID token, upsert a user, return an API token.

The frontend renders Google's Sign in with Google button (same flow for login and
signup) and POSTs the returned credential (a JWT ID token) here. We verify it with
Google's library, then get-or-create a Django user keyed by email and hand back a
DRF auth token the SPA stores and sends as `Authorization: Token <token>`.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


def _user_payload(user, token=None):
    data = {
        "id": user.id,
        "email": user.email,
        "name": (user.get_full_name() or user.first_name or user.username or user.email),
        "first_name": user.first_name,
    }
    if token is not None:
        data["token"] = token
    return data


@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    if not settings.GOOGLE_CLIENT_ID:
        return Response(
            {"detail": "Google sign-in is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    credential = request.data.get("credential")
    if not credential:
        return Response(
            {"detail": "Missing Google credential."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        info = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        return Response(
            {"detail": "Invalid or expired Google credential."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    email = (info.get("email") or "").lower()
    if not email or not info.get("email_verified", False):
        return Response(
            {"detail": "Google account has no verified email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Upsert by email. Username is email-derived but unique-safe.
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email[:150],
            "first_name": info.get("given_name", "")[:150],
            "last_name": info.get("family_name", "")[:150],
        },
    )
    # Backfill names on an existing account that signed up some other way.
    if not created and not user.first_name and info.get("given_name"):
        user.first_name = info.get("given_name", "")[:150]
        user.last_name = info.get("family_name", "")[:150]
        user.save(update_fields=["first_name", "last_name"])

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        _user_payload(user, token.key),
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(_user_payload(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    # Invalidate the current token so it can't be reused.
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

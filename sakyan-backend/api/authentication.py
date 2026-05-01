import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User


class SupabaseJWTAuthentication(BaseAuthentication):
    """Validates Supabase JWT tokens against Supabase Auth API."""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        response = requests.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                'Authorization': f'Bearer {token}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
            },
            timeout=5
        )

        if response.status_code != 200:
            raise AuthenticationFailed('Invalid or expired token.')

        supabase_user = response.json()
        user_id = supabase_user.get('id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User profile not found. Please complete registration.')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'
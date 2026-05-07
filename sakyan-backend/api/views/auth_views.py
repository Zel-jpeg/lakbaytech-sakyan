from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed
from django.conf import settings
from ..models import User
from ..serializers import UserSerializer, RegisterSerializer
import requests


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Security: verify the Bearer token's identity matches the user_id being registered.
        # This prevents anyone from creating a profile for someone else's Supabase account.
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            raise AuthenticationFailed('A valid Supabase token is required to register.')

        token = auth_header.split(' ')[1]
        try:
            resp = requests.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    'Authorization': f'Bearer {token}',
                    'apikey': settings.SUPABASE_SERVICE_KEY,
                },
                timeout=10
            )
        except requests.exceptions.RequestException:
            raise AuthenticationFailed('Could not verify token with authentication service.')

        if resp.status_code != 200:
            raise AuthenticationFailed('Invalid or expired token.')

        token_user_id = resp.json().get('id')
        requested_user_id = request.data.get('user_id')

        if token_user_id != requested_user_id:
            raise PermissionDenied('Token identity does not match the user_id provided.')

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=200)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
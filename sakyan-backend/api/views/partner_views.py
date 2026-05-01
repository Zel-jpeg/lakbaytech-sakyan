from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Partner
from ..serializers import PartnerSerializer, PartnerApplySerializer


class PartnerApplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'partner'):
            return Response({'error': 'You already have a partner application.'}, status=400)
        serializer = PartnerApplySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        partner = serializer.save()
        return Response(PartnerSerializer(partner).data, status=201)


class PartnerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.partner
        except Partner.DoesNotExist:
            return Response({'error': 'No partner profile found.'}, status=404)
        return Response(PartnerSerializer(partner).data)

    def patch(self, request):
        try:
            partner = request.user.partner
        except Partner.DoesNotExist:
            return Response({'error': 'No partner profile found.'}, status=404)
        serializer = PartnerApplySerializer(partner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PartnerSerializer(partner).data)
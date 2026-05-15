from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from ..models import Partner, PartnerBoostRequest, Message, User
from ..serializers import PartnerSerializer, PartnerApplySerializer, ApprovedPartnerSerializer, PartnerBoostRequestSerializer
from ..permissions import IsPartner
from ..utils import push_notification


class PartnerApplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'partner'):
            return Response({'error': 'You already have a partner application.'}, status=400)
        serializer = PartnerApplySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        partner = serializer.save()
        # Set commission default based on partner type
        if partner.partner_type == 'individual':
            partner.commission_rate = 3.00
        else:
            partner.commission_rate = 5.00
        partner.save(update_fields=['commission_rate'])
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


class ApprovedPartnersView(APIView):
    """GET /api/partners/approved/ — public list for Browse Cars partner filter."""
    permission_classes = [AllowAny]

    def get(self, request):
        partners = (
            Partner.objects
            .filter(status='approved')
            .select_related('user')
            .prefetch_related('cars')
        )
        # Only include partners who have at least 1 active car
        partners = [p for p in partners if p.cars.filter(status='active', is_available=True).exists()]
        serializer = ApprovedPartnerSerializer(partners, many=True)
        return Response(serializer.data)


class PartnerBoostRequestView(APIView):
    """POST /api/boosts/request/ — partner submits a boost request."""
    permission_classes = [IsPartner]

    def get(self, request):
        """GET — partner's own boost requests."""
        requests = PartnerBoostRequest.objects.filter(partner=request.user.partner)
        return Response(PartnerBoostRequestSerializer(requests, many=True).data)

    def post(self, request):
        partner = request.user.partner
        boost_type      = request.data.get('boost_type', 'featured')
        duration_months = int(request.data.get('duration_months', 1))

        boost_type_label = dict(PartnerBoostRequest.BOOST_TYPE_CHOICES).get(boost_type, 'Featured Listing')
        duration_label   = f"{duration_months} month{'s' if duration_months > 1 else ''}"

        auto_message = (
            f"Hello Sakyan Admin! I would like to request a \"{boost_type_label}\" "
            f"for my business \"{partner.business_name}\". "
            f"Preferred duration: {duration_label}. "
            f"Please let me know the next steps for payment and activation. Thank you!"
        )

        boost = PartnerBoostRequest.objects.create(
            partner=partner,
            boost_type=boost_type,
            duration_months=duration_months,
            partner_message=auto_message,
        )

        # Auto-send message to admin
        admin_user = User.objects.filter(role='admin').first()
        if admin_user:
            Message.objects.create(
                sender=request.user,
                receiver=admin_user,
                content=auto_message,
                booking=None,
            )
            push_notification(
                user_id=admin_user.id,
                title=f'Boost Request from {partner.business_name}',
                message=f'{partner.business_name} has requested a {boost_type_label}.',
                notification_type='boost',
                reference_id=boost.id,
            )

        return Response(PartnerBoostRequestSerializer(boost).data, status=201)
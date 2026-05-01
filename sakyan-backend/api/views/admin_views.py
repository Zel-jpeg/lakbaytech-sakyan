from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from ..models import Partner, Booking, User, Car
from ..serializers import PartnerSerializer, BookingSerializer, UserSerializer
from ..permissions import IsAdmin
from ..utils import push_notification


class AdminPartnerListView(generics.ListAPIView):
    serializer_class = PartnerSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        status = self.request.query_params.get('status', 'pending')
        return Partner.objects.filter(status=status).select_related('user')


class AdminPartnerActionView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk, action):
        try:
            partner = Partner.objects.get(pk=pk)
        except Partner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if action == 'approve':
            partner.status = 'approved'
            partner.approved_at = timezone.now()
            partner.approved_by = request.user
            partner.save()
            partner.user.role = 'partner'
            partner.user.save()
            push_notification(
                user_id=partner.user_id,
                title='Application Approved! 🎉',
                message='Congratulations! Your Sakyan partner application is approved. Start listing your cars!',
                notification_type='approval',
                reference_id=partner.id
            )

        elif action == 'reject':
            partner.status = 'rejected'
            partner.rejection_reason = request.data.get('reason', '')
            partner.save()
            push_notification(
                user_id=partner.user_id,
                title='Application Not Approved',
                message=f"Your application was not approved. Reason: {partner.rejection_reason}",
                notification_type='approval',
                reference_id=partner.id
            )

        elif action == 'suspend':
            partner.status = 'suspended'
            partner.save()
            partner.user.role = 'customer'
            partner.user.save()

        return Response(PartnerSerializer(partner).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = {
            'total_users':       User.objects.count(),
            'total_cars':        Car.objects.count(),
            'total_bookings':    Booking.objects.count(),
            'total_revenue':     Booking.objects.filter(
                booking_status='completed'
            ).aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0,
            
            'pending_partners':  Partner.objects.filter(status='pending').count(),
            'active_partners':   Partner.objects.filter(status='approved').count(),
            'pending_bookings':  Booking.objects.filter(booking_status='pending').count(),
            'active_bookings':   Booking.objects.filter(booking_status='active').count(),
        }
        return Response(stats)


class AdminAllBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Booking.objects.all().select_related('car', 'customer', 'partner')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(booking_status=status)
        return qs
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Booking, CustomerProfile
from ..serializers import BookingSerializer, BookingCreateSerializer, CustomerProfileSerializer
from ..permissions import IsPartner, IsCustomer
from ..utils import push_notification


class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsCustomer]

    def perform_create(self, serializer):
        booking = serializer.save()
        push_notification(
            user_id=booking.partner.user_id,
            title='New Booking Request 🚗',
            message=f'{booking.customer.full_name} wants to book {booking.car.name} ({booking.booking_code})',
            notification_type='booking',
            reference_id=booking.id
        )


class CustomerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Booking.objects.filter(
            customer=self.request.user
        ).select_related('car', 'partner').prefetch_related('car__images')


class PartnerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        qs = Booking.objects.filter(
            partner=self.request.user.partner
        ).select_related('car', 'customer', 'customer__profile')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(booking_status=status_filter)
        return qs


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        if user.role == 'partner':
            return Booking.objects.filter(partner=user.partner)
        return Booking.objects.filter(customer=user)


class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, action):
        allowed_actions = {
            'approve': ('partner', 'pending_review', 'approved'),
            'reject':  ('partner', 'pending_review', 'rejected'),
            'cancel':  ('customer', 'pending_review', 'cancelled'),
            'complete':('partner', 'active',          'completed'),
        }
        if action not in allowed_actions:
            return Response({'error': 'Invalid action'}, status=400)

        required_role, from_status, to_status = allowed_actions[action]

        try:
            if request.user.role == 'partner':
                booking = Booking.objects.get(pk=pk, partner=request.user.partner)
            elif request.user.role == 'customer':
                booking = Booking.objects.get(pk=pk, customer=request.user)
            else:
                booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if booking.booking_status != from_status and request.user.role != 'admin':
            return Response({'error': f'Can only {action} bookings in {from_status} status'}, status=400)

        booking.booking_status = to_status
        if action == 'reject':
            booking.admin_notes = request.data.get('reason', '')
        booking.save()

        if action in ('approve', 'reject'):
            push_notification(
                user_id=booking.customer_id,
                title=f'Booking {to_status.title()} 📋',
                message=f'Your booking {booking.booking_code} has been {to_status}.',
                notification_type='booking',
                reference_id=booking.id
            )

        return Response(BookingSerializer(booking).data)


class SaveKYCView(generics.CreateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsCustomer]

    def create(self, request, *args, **kwargs):
        profile, created = CustomerProfile.objects.update_or_create(
            user=request.user,
            defaults=request.data
        )
        return Response(
            CustomerProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
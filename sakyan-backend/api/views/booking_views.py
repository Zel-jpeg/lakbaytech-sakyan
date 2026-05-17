from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Booking, CustomerProfile, User, Message
from ..serializers import BookingSerializer, BookingCreateSerializer, CustomerProfileSerializer, KYCSubmitSerializer
from ..permissions import IsPartner, IsCustomer
from ..utils import push_notification


class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsCustomer]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()   # ← booking is committed to DB here

        payment_label = 'GCash' if booking.payment_method == 'gcash' else 'Cash'

        # Side-effects: wrap each in try/except so they never roll back the booking
        try:
            push_notification(
                user_id=booking.partner.user_id,
                title='New Booking Request 🚗',
                message=(
                    f'{booking.customer.full_name} wants to book {booking.car.name} '
                    f'({booking.booking_code}) — Payment: {payment_label}'
                ),
                notification_type='booking',
                reference_id=booking.id
            )
        except Exception:
            pass

        try:
            admin = User.objects.filter(role='admin').first()
            if admin:
                push_notification(
                    user_id=admin.id,
                    title='New Booking 📋',
                    message=(
                        f'{booking.customer.full_name} booked {booking.car.name} '
                        f'via {payment_label} ({booking.booking_code})'
                    ),
                    notification_type='booking',
                    reference_id=booking.id
                )
        except Exception:
            pass

        try:
            Message.objects.create(
                booking=booking,
                sender=booking.customer,
                receiver=booking.partner.user,
                content=(
                    f"Hi! I've submitted a booking request for {booking.car.name} "
                    f"from {booking.start_date} to {booking.end_date}. "
                    f"I'll be paying via {payment_label}. Looking forward to hearing from you!"
                )
            )
        except Exception:
            pass

        full_data = BookingSerializer(booking, context={'request': request}).data
        return Response(full_data, status=status.HTTP_201_CREATED)



class CustomerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Booking.objects.filter(
            customer=self.request.user
        ).select_related('car', 'partner', 'partner__user').prefetch_related('car__images')


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

    # Maps action → (required_role, allowed_from_statuses, to_status)
    ALLOWED_ACTIONS = {
        'approve': ('partner',   ['pending_review'],         'approved'),
        'reject':  ('partner',   ['pending_review'],         'rejected'),
        'cancel':  ('customer',  ['pending_review', 'approved'], 'cancelled'),
        'complete':('partner',   ['active'],                 'completed'),
    }

    def patch(self, request, pk, action):
        if action not in self.ALLOWED_ACTIONS:
            return Response({'error': 'Invalid action'}, status=400)

        required_role, from_statuses, to_status = self.ALLOWED_ACTIONS[action]

        try:
            if request.user.role == 'partner':
                booking = Booking.objects.get(pk=pk, partner=request.user.partner)
            elif request.user.role == 'customer':
                booking = Booking.objects.get(pk=pk, customer=request.user)
            else:
                booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if booking.booking_status not in from_statuses and request.user.role != 'admin':
            statuses_str = ' or '.join(from_statuses)
            return Response({'error': f'Can only {action} bookings in {statuses_str} status'}, status=400)

        # Enforce role: only the correct role can perform each action (admins bypass)
        if request.user.role != 'admin' and request.user.role != required_role:
            return Response({'error': f'Only a {required_role} can {action} a booking'}, status=403)

        booking.booking_status = to_status
        if action == 'reject':
            booking.admin_notes = request.data.get('reason', '')
        booking.save()

        if action == 'approve':
            # Build smart msg based on fulfillment type
            is_delivery = booking.fulfillment_type == 'delivery'
            car_loc = booking.car.location or 'the partner\'s location'
            if is_delivery:
                next_step = (
                    f'The partner will deliver the car to your address on {booking.start_date}. '
                    f'Open your messages to confirm delivery details.'
                )
            else:
                next_step = (
                    f'Please pick up the car at {car_loc} on {booking.start_date}. '
                    f'Open your messages for more details from the partner.'
                )
            try:
                push_notification(
                    user_id=booking.customer_id,
                    title='Booking Approved! 🎉',
                    message=f'Your booking {booking.booking_code} for {booking.car.name} is confirmed. {next_step}',
                    notification_type='booking',
                    reference_id=booking.id
                )
            except Exception:
                pass
        elif action == 'reject':
            try:
                push_notification(
                    user_id=booking.customer_id,
                    title='Booking Not Approved 📋',
                    message=f'Your booking {booking.booking_code} was not approved by the partner.',
                    notification_type='booking',
                    reference_id=booking.id
                )
            except Exception:
                pass
        elif action == 'cancel':
            try:
                push_notification(
                    user_id=booking.partner.user_id,
                    title='Booking Cancelled',
                    message=f'{booking.customer.full_name} cancelled booking {booking.booking_code} for {booking.car.name}.',
                    notification_type='booking',
                    reference_id=booking.id
                )
            except Exception:
                pass

        return Response(BookingSerializer(booking).data)


class UpdatePaymentStatusView(APIView):
    """Partner marks how much of the booking has been paid."""
    permission_classes = [IsPartner]

    VALID_STATUSES = ('pending', 'partial', 'paid', 'refunded')

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, partner=request.user.partner)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        new_status = request.data.get('payment_status', '').strip()
        if new_status and new_status not in self.VALID_STATUSES:
            return Response(
                {'error': f'Invalid payment_status. Choose from: {", ".join(self.VALID_STATUSES)}'},
                status=400
            )

        update_fields = ['updated_at']
        if new_status:
            booking.payment_status = new_status
            update_fields.append('payment_status')
        if 'payment_notes' in request.data:
            booking.payment_notes = request.data['payment_notes']
            update_fields.append('payment_notes')
        if 'partner_gcash_reference' in request.data:
            booking.partner_gcash_reference = request.data['partner_gcash_reference']
            update_fields.append('partner_gcash_reference')

        booking.save(update_fields=update_fields)
        return Response(BookingSerializer(booking).data)


class UpdateRentalTimesView(APIView):
    """Partner logs actual hand-off and return times for overdue tracking."""
    permission_classes = [IsPartner]

    def patch(self, request, pk):
        from django.utils import timezone as tz
        from datetime import timezone as dt_tz, timedelta as dt_td
        ph_tz = dt_tz(dt_td(hours=8))

        try:
            booking = Booking.objects.get(pk=pk, partner=request.user.partner)
        except Booking.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        update_fields = ['updated_at']
        logged_start = False
        logged_return = False

        # Log start time — also transitions booking to 'active'
        if 'actual_start_time' in request.data:
            raw = request.data['actual_start_time']
            booking.actual_start_time = raw if raw else tz.now()
            update_fields.append('actual_start_time')
            if booking.booking_status == 'approved':
                booking.booking_status = 'active'
                update_fields.append('booking_status')
            logged_start = True

        # Log return time — also transitions booking to 'completed'
        if 'actual_return_time' in request.data:
            raw = request.data['actual_return_time']
            booking.actual_return_time = raw if raw else tz.now()
            update_fields.append('actual_return_time')
            if booking.booking_status == 'active':
                booking.booking_status = 'completed'
                update_fields.append('booking_status')
            logged_return = True

        booking.save(update_fields=update_fields)

        # ── Notify customer of car hand-off ──────────────────────────────
        if logged_start and booking.actual_start_time:
            try:
                local_dt = booking.actual_start_time.astimezone(ph_tz)
                fmt = local_dt.strftime('%B %d, %Y at %I:%M %p')
                push_notification(
                    user_id=booking.customer_id,
                    title='Car Handed Over! 🚗',
                    message=(
                        f'Your {booking.car.name} rental has officially started. '
                        f'Handed over at {fmt}. Please return by {booking.end_date}.'
                    ),
                    notification_type='booking',
                    reference_id=booking.id
                )
            except Exception:
                pass
            try:
                local_dt = booking.actual_start_time.astimezone(ph_tz)
                fmt = local_dt.strftime('%B %d, %Y at %I:%M %p')
                Message.objects.create(
                    booking=booking,
                    sender=booking.partner.user,
                    receiver=booking.customer,
                    content=(
                        f"\u2705 Car hand-off recorded!\n\n"
                        f"\U0001f4c5 Handed over at: {fmt}\n"
                        f"\U0001f504 Please return the car by: {booking.end_date}\n\n"
                        f"Enjoy your trip! Drive safe \U0001f64f"
                    )
                )
            except Exception:
                pass

        # ── Notify customer of car return ─────────────────────────────────
        if logged_return and booking.actual_return_time:
            try:
                local_dt = booking.actual_return_time.astimezone(ph_tz)
                fmt = local_dt.strftime('%B %d, %Y at %I:%M %p')
                push_notification(
                    user_id=booking.customer_id,
                    title='Rental Completed \u2705',
                    message=(
                        f'Your {booking.car.name} rental has ended. '
                        f'Car returned at {fmt}. Thank you!'
                    ),
                    notification_type='booking',
                    reference_id=booking.id
                )
            except Exception:
                pass
            try:
                local_dt = booking.actual_return_time.astimezone(ph_tz)
                fmt = local_dt.strftime('%B %d, %Y at %I:%M %p')
                Message.objects.create(
                    booking=booking,
                    sender=booking.partner.user,
                    receiver=booking.customer,
                    content=(
                        f"\u2705 Car return confirmed!\n\n"
                        f"\U0001f4c5 Returned at: {fmt}\n\n"
                        f"Thank you for choosing Sakyan! We hope you had a great experience. \U0001f64f"
                    )
                )
            except Exception:
                pass

        return Response(BookingSerializer(booking).data)


class SaveKYCView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        """Customer submits KYC — sets status to pending for admin review."""
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)

        # Don't allow re-submission if already approved
        if profile.kyc_status == 'approved':
            return Response(
                {'error': 'Your account is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = KYCSubmitSerializer(profile, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(
            kyc_status='pending',
            kyc_submitted_at=timezone.now(),
            kyc_rejection_reason='',
            is_verified=False,
        )

        # Notify all admins (find first admin user)
        admin = User.objects.filter(role='admin').first()
        if admin:
            push_notification(
                user_id=admin.id,
                title='New KYC Submission 🪪',
                message=f'{request.user.full_name} submitted their identity verification.',
                notification_type='kyc',
                reference_id=profile.id
            )

        return Response(CustomerProfileSerializer(profile).data, status=status.HTTP_200_OK)

    def get(self, request):
        """Get current user's KYC profile."""
        try:
            profile = request.user.profile
            return Response(CustomerProfileSerializer(profile).data)
        except CustomerProfile.DoesNotExist:
            return Response({'kyc_status': 'not_submitted', 'is_verified': False})
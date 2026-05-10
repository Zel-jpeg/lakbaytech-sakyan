from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Q
from django.utils import timezone
from ..models import Partner, Booking, User, Car, PlatformSetting, CustomerProfile, PartnerSettlement
from ..serializers import (
    PartnerSerializer, BookingSerializer, UserSerializer,
    PlatformSettingSerializer, KYCAdminSerializer, PartnerSettlementSerializer
)
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

        elif action == 'update-commission':
            rate = request.data.get('commission_rate')
            if rate is None:
                return Response({'error': 'commission_rate is required.'}, status=400)
            try:
                rate = float(rate)
                if not (0 <= rate <= 100):
                    raise ValueError
            except (ValueError, TypeError):
                return Response({'error': 'commission_rate must be a number between 0 and 100.'}, status=400)
            partner.commission_rate = rate
            partner.save(update_fields=['commission_rate', 'updated_at'])

        else:
            return Response({'error': 'Invalid action.'}, status=400)

        return Response(PartnerSerializer(partner).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        completed_bookings = Booking.objects.filter(booking_status='completed')
        totals = completed_bookings.aggregate(
            comm=Sum('commission_amount'),
            fees=Sum('booking_fee')
        )
        total_commission = totals['comm'] or 0
        total_booking_fees = totals['fees'] or 0
        total_revenue = total_commission + total_booking_fees

        stats = {
            'total_users':       User.objects.count(),
            'total_cars':        Car.objects.count(),
            'total_bookings':    Booking.objects.count(),
            'total_revenue':     total_revenue,
            'total_commission':  total_commission,
            'total_booking_fees': total_booking_fees,

            'completed_bookings': completed_bookings.count(),
            'cancelled_bookings': Booking.objects.filter(booking_status='cancelled').count(),
            'rejected_bookings':  Booking.objects.filter(booking_status='rejected').count(),
            'pending_bookings':  Booking.objects.filter(booking_status='pending_review').count(),
            'active_bookings':   Booking.objects.filter(booking_status='active').count(),

            'pending_partners':  Partner.objects.filter(status='pending').count(),
            'active_partners':   Partner.objects.filter(status='approved').count(),
            'rejected_partners': Partner.objects.filter(status='rejected').count(),
            'suspended_partners': Partner.objects.filter(status='suspended').count(),

            'total_customers':   User.objects.filter(role='customer').count(),
            'total_partners':    User.objects.filter(role='partner').count(),
            'total_admins':      User.objects.filter(role='admin').count(),

            'kyc_approved':      CustomerProfile.objects.filter(kyc_status='approved').count(),
            'kyc_rejected':      CustomerProfile.objects.filter(kyc_status='rejected').count(),
            'pending_kyc':       CustomerProfile.objects.filter(kyc_status='pending').count(),
            'kyc_pending':       CustomerProfile.objects.filter(kyc_status='pending').count(),
        }
        return Response(stats)


class PublicStatsView(APIView):
    """Public (no auth) landing-page stats — only safe aggregate counts."""
    permission_classes = [AllowAny]

    def get(self, request):
        total_users = User.objects.count()
        available_cars = Car.objects.filter(status='active', is_available=True).count()
        cities = (
            Car.objects.filter(status='active', is_available=True)
            .values_list('location', flat=True)
            .distinct()
            .count()
        )
        active_partners = Partner.objects.filter(status='approved').count()
        completed_bookings = Booking.objects.filter(
            booking_status__in=['completed', 'active', 'approved']
        ).count()
        return Response({
            'total_users': total_users,
            'available_cars': available_cars,
            'cities': cities,
            'active_partners': active_partners,
            'completed_bookings': completed_bookings,
        })


class AdminAllBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Booking.objects.all().select_related('car', 'customer', 'partner')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(booking_status=status)
        return qs

class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        role_filter = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-created_at')
        if role_filter:
            qs = qs.filter(role=role_filter)
        return qs


class AdminSettingsView(APIView):
    """GET  /api/admin/settings/  → list all settings (public read)
       PATCH via AdminSettingUpdateView"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        settings = PlatformSetting.objects.all()
        return Response(PlatformSettingSerializer(settings, many=True).data)


class AdminSettingUpdateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, key):
        setting, created = PlatformSetting.objects.get_or_create(
            key=key,
            defaults={'value': 0, 'label': key.replace('_', ' ').title()}
        )
        serializer = PlatformSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class AdminKYCListView(generics.ListAPIView):
    """GET /api/admin/kyc/?status=pending"""
    serializer_class = KYCAdminSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        kyc_status = self.request.query_params.get('status', 'pending')
        return (
            CustomerProfile.objects
            .filter(kyc_status=kyc_status)
            .select_related('user')
            .order_by('-kyc_submitted_at')
        )


class AdminKYCActionView(APIView):
    """PATCH /api/admin/kyc/<pk>/approve|reject/"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk, action):
        try:
            profile = CustomerProfile.objects.select_related('user').get(pk=pk)
        except CustomerProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        now = timezone.now()

        if action == 'approve':
            profile.kyc_status       = 'approved'
            profile.is_verified      = True
            profile.kyc_reviewed_at  = now
            profile.kyc_reviewed_by  = request.user
            profile.kyc_rejection_reason = ''
            profile.save()
            push_notification(
                user_id=profile.user_id,
                title='Identity Verified! ✅',
                message='Your identity has been verified. You can now book cars on Sakyan.',
                notification_type='kyc',
                reference_id=profile.id
            )

        elif action == 'reject':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'error': 'Rejection reason is required.'}, status=400)
            profile.kyc_status           = 'rejected'
            profile.is_verified          = False
            profile.kyc_rejection_reason = reason
            profile.kyc_reviewed_at      = now
            profile.kyc_reviewed_by      = request.user
            profile.save()
            push_notification(
                user_id=profile.user_id,
                title='Verification Not Approved',
                message=f'Your KYC was not approved. Reason: {reason}. Please re-submit with correct documents.',
                notification_type='kyc',
                reference_id=profile.id
            )

        else:
            return Response({'error': 'Invalid action. Use approve or reject.'}, status=400)

        return Response(KYCAdminSerializer(profile).data)


# ─── Settlement Views ──────────────────────────────────────────────────────────

class AdminSettlementListView(generics.ListAPIView):
    """GET /api/admin/settlements/?status=pending&partner_id=<uuid>"""
    serializer_class = PartnerSettlementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = PartnerSettlement.objects.select_related('partner', 'partner__user')
        status = self.request.query_params.get('status')
        partner_id = self.request.query_params.get('partner_id')
        if status:
            qs = qs.filter(status=status)
        if partner_id:
            qs = qs.filter(partner_id=partner_id)
        return qs


class AdminCreateSettlementView(APIView):
    """POST /api/admin/settlements/
    Auto-calculates totals from completed bookings in the given date range.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        partner_id   = request.data.get('partner_id')
        period_start = request.data.get('period_start')
        period_end   = request.data.get('period_end')
        notes        = request.data.get('notes', '')

        if not all([partner_id, period_start, period_end]):
            return Response({'error': 'partner_id, period_start, and period_end are required.'}, status=400)

        try:
            partner = Partner.objects.get(pk=partner_id)
        except Partner.DoesNotExist:
            return Response({'error': 'Partner not found.'}, status=404)

        # Aggregate from completed bookings in the period
        bookings_in_period = Booking.objects.filter(
            partner=partner,
            booking_status='completed',
            start_date__gte=period_start,
            end_date__lte=period_end,
        )
        totals = bookings_in_period.aggregate(
            commission=Sum('commission_amount'),
            fees=Sum('booking_fee'),
        )
        total_commission = totals['commission'] or 0
        total_fees       = totals['fees'] or 0
        total_owed       = total_commission + total_fees

        settlement = PartnerSettlement.objects.create(
            partner=partner,
            period_start=period_start,
            period_end=period_end,
            total_commission=total_commission,
            total_fees=total_fees,
            total_owed=total_owed,
            notes=notes,
        )
        return Response(PartnerSettlementSerializer(settlement).data, status=201)


class AdminSettlementActionView(APIView):
    """PATCH /api/admin/settlements/<pk>/settle/
    Mark a settlement as settled, record amount received.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            settlement = PartnerSettlement.objects.get(pk=pk)
        except PartnerSettlement.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        amount_received = request.data.get('amount_received')
        notes = request.data.get('notes', settlement.notes)

        if amount_received is not None:
            settlement.amount_received = amount_received
        settlement.status     = 'settled'
        settlement.settled_at = timezone.now()
        settlement.notes      = notes
        settlement.save()

        return Response(PartnerSettlementSerializer(settlement).data)
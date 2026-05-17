from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from ..models import Message, Booking, User, Car
from ..serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs['booking_id']
        user = self.request.user
        Message.objects.filter(
            booking_id=booking_id,
            receiver=user,
            is_read=False
        ).update(is_read=True)
        return Message.objects.filter(booking_id=booking_id).order_by('created_at')


class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            image_url=self.request.data.get('image_url') or None,
        )


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _admin_ids():
    """List of admin user UUIDs — used to distinguish support vs inquiry messages."""
    return list(User.objects.filter(role='admin').values_list('id', flat=True))


# ─── Support Thread (user ↔ admin only, booking=None) ────────────────────────

class SupportThreadView(APIView):
    """
    GET  /messages/support/                    → user sees their admin support thread
    GET  /messages/support/?partner_id=<uuid>  → admin fetches a specific user's thread
    POST /messages/support/                    → send to admin
         body (customer/partner): { content }
         body (admin):            { content, receiver_id }
    """
    permission_classes = [IsAuthenticated]

    def _get_admin(self):
        return User.objects.filter(role='admin').order_by('created_at').first()

    def get(self, request):
        user = request.user
        ids = _admin_ids()
        partner_id = request.query_params.get('partner_id')

        if user.role == 'admin':
            if partner_id:
                qs = Message.objects.filter(
                    booking__isnull=True
                ).filter(
                    Q(sender_id=partner_id) | Q(receiver_id=partner_id)
                ).filter(
                    Q(sender_id__in=ids) | Q(receiver_id__in=ids)
                ).order_by('created_at')
                qs.filter(receiver=user, is_read=False).update(is_read=True)
            else:
                qs = Message.objects.filter(
                    booking__isnull=True
                ).filter(
                    Q(sender_id__in=ids) | Q(receiver_id__in=ids)
                ).order_by('created_at')
        else:
            # Only messages where the OTHER side is an admin
            qs = Message.objects.filter(
                booking__isnull=True
            ).filter(
                Q(sender_id__in=ids) | Q(receiver_id__in=ids)
            ).filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('created_at')
            qs.filter(receiver=user, is_read=False).update(is_read=True)

        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request):
        user      = request.user
        content   = request.data.get('content', '').strip()
        image_url = request.data.get('image_url', '').strip() or None

        if not content and not image_url:
            return Response({'error': 'Either content or image_url is required.'}, status=400)

        if user.role == 'admin':
            receiver_id = request.data.get('receiver_id')
            if not receiver_id:
                return Response({'error': 'receiver_id is required for admin replies.'}, status=400)
            try:
                receiver = User.objects.get(pk=receiver_id)
            except (User.DoesNotExist, Exception):
                return Response({'error': 'Receiver not found.'}, status=404)
        else:
            receiver = self._get_admin()
            if not receiver:
                return Response({'error': 'No admin available right now.'}, status=503)

        msg = Message.objects.create(
            booking=None, sender=user, receiver=receiver,
            content=content, image_url=image_url,
        )
        return Response(MessageSerializer(msg).data, status=201)


# ─── Conversation List (booking + support pinned + inquiry threads) ───────────

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user   = request.user
        ids    = _admin_ids()
        id_set = set(ids)

        # ── 1. Booking-based conversations ────────────────────────────────────
        bookings = Booking.objects.filter(
            Q(customer=user) | Q(partner__user=user)
        ).select_related('car', 'customer', 'partner', 'partner__user')

        conversations = []
        for booking in bookings:
            booking_messages = Message.objects.filter(
                booking=booking
            ).order_by('-created_at')
            last_message = booking_messages.first()
            unread_count = booking_messages.filter(
                receiver=user, is_read=False
            ).count()

            conversations.append({
                'booking_id':      str(booking.id),
                'booking_code':    booking.booking_code,
                'car_name':        booking.car.name,
                'customer_name':   booking.customer.full_name,
                'partner_name':    booking.partner.business_name,
                'customer_id':     str(booking.customer_id),
                'partner_user_id': str(booking.partner.user_id),
                'unread_count':    unread_count,
                'last_message': {
                    'content':    last_message.content,
                    'created_at': last_message.created_at,
                    'sender_id':  str(last_message.sender_id),
                } if last_message else None,
            })

        conversations.sort(
            key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
            reverse=True,
        )

        # ── 2. Support thread entry (admin ↔ user, booking=None) ──────────────
        if user.role == 'admin':
            # One entry per unique non-admin user who has an admin support thread
            support_msgs_all = (
                Message.objects
                .filter(booking__isnull=True)
                .filter(Q(sender_id__in=ids) | Q(receiver_id__in=ids))
                .select_related('sender', 'receiver')
                .order_by('created_at')
            )
            seen = set()
            support_convs = []
            for msg in support_msgs_all:
                other = msg.receiver if msg.sender_id in id_set else msg.sender
                if other.id in seen:
                    continue
                seen.add(other.id)

                thread_qs = Message.objects.filter(
                    booking__isnull=True
                ).filter(
                    Q(sender_id__in=ids) | Q(receiver_id__in=ids)
                ).filter(
                    Q(sender=other) | Q(receiver=other)
                ).order_by('-created_at')
                last   = thread_qs.first()
                unread = thread_qs.filter(receiver=user, is_read=False).count()

                support_convs.append({
                    'booking_id':         f'support:{other.id}',
                    'booking_code':       'Support',
                    'car_name':           'Sakyan Support',
                    'customer_name':      other.full_name,
                    'partner_name':       'Sakyan Support',
                    'customer_id':        str(other.id),
                    'partner_user_id':    str(user.id),
                    'is_support':         True,
                    'support_partner_id': str(other.id),
                    'unread_count':       unread,
                    'last_message': {
                        'content':    last.content,
                        'created_at': last.created_at,
                        'sender_id':  str(last.sender_id),
                    } if last else None,
                })

            support_convs.sort(
                key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
                reverse=True,
            )
            conversations = support_convs + conversations

        else:
            # Customer / Partner: one pinned Sakyan Support entry (admin-only messages)
            support_msgs = Message.objects.filter(
                booking__isnull=True
            ).filter(
                Q(sender_id__in=ids) | Q(receiver_id__in=ids)
            ).filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('-created_at')
            last_support   = support_msgs.first()
            unread_support = support_msgs.filter(receiver=user, is_read=False).count()

            support_entry = {
                'booking_id':      'support',
                'booking_code':    'Support',
                'car_name':        'Sakyan Support',
                'customer_name':   'Sakyan Support',
                'partner_name':    'Sakyan Support',
                'customer_id':     str(user.id),
                'partner_user_id': str(user.id),
                'is_support':      True,
                'unread_count':    unread_support,
                'last_message': {
                    'content':    last_support.content,
                    'created_at': last_support.created_at,
                    'sender_id':  str(last_support.sender_id),
                } if last_support else None,
            }
            conversations = [support_entry] + conversations

        # ── 3. Inquiry threads (customer ↔ partner, booking=None, NO admin) ───
        if user.role != 'admin':
            inquiry_msgs = Message.objects.filter(
                booking__isnull=True
            ).exclude(
                Q(sender_id__in=ids) | Q(receiver_id__in=ids)
            ).filter(
                Q(sender=user) | Q(receiver=user)
            ).select_related('sender', 'receiver').order_by('created_at')

            # Group by the other person
            seen_inquiry = {}
            for msg in inquiry_msgs:
                other = msg.receiver if msg.sender_id == user.id else msg.sender
                seen_inquiry[str(other.id)] = other

            inquiry_convs = []
            for other_id, other_user in seen_inquiry.items():
                thread = Message.objects.filter(
                    booking__isnull=True
                ).exclude(
                    Q(sender_id__in=ids) | Q(receiver_id__in=ids)
                ).filter(
                    Q(sender=user, receiver=other_user) |
                    Q(sender=other_user, receiver=user)
                ).order_by('-created_at')
                last   = thread.first()
                unread = thread.filter(receiver=user, is_read=False).count()

                if user.role == 'customer':
                    try:
                        display_name = other_user.partner.business_name
                    except Exception:
                        display_name = other_user.full_name

                    car_name_hint = 'Pre-booking Inquiry'

                    inquiry_convs.append({
                        'booking_id':      f'inquiry:{other_id}',
                        'booking_code':    'Inquiry',
                        'car_name':        car_name_hint,
                        'customer_name':   user.full_name,
                        'partner_name':    display_name,
                        'customer_id':     str(user.id),
                        'partner_user_id': other_id,
                        'is_inquiry':      True,
                        'unread_count':    unread,
                        'last_message': {
                            'content':    last.content,
                            'created_at': last.created_at,
                            'sender_id':  str(last.sender_id),
                        } if last else None,
                    })

                else:
                    # Partner role — other is a customer
                    # Try to guess the car from this partner's fleet (best effort)
                    car_name_hint = 'Pre-booking Inquiry'
                    try:
                        partner_cars = Car.objects.filter(partner__user=user)
                        if partner_cars.count() == 1:
                            car_name_hint = partner_cars.first().name
                    except Exception:
                        pass

                    inquiry_convs.append({
                        'booking_id':      f'inquiry:{other_id}',
                        'booking_code':    'Inquiry',
                        'car_name':        car_name_hint,
                        'customer_name':   other_user.full_name,
                        'partner_name':    user.full_name,
                        'customer_id':     other_id,
                        'partner_user_id': str(user.id),
                        'is_inquiry':      True,
                        'unread_count':    unread,
                        'last_message': {
                            'content':    last.content,
                            'created_at': last.created_at,
                            'sender_id':  str(last.sender_id),
                        } if last else None,
                    })

            inquiry_convs.sort(
                key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
                reverse=True,
            )
            # Insert: [support_pin] + inquiry_convs + booking_convs
            support_pin   = conversations[:1]
            booking_convs = conversations[1:]
            conversations = support_pin + inquiry_convs + booking_convs

        return Response(conversations)


# ─── Pre-Booking Inquiry (customer ↔ partner, booking=None, no admin) ─────────

class InquiryMessageView(APIView):
    """
    POST /messages/inquiry/
        Customer sends: { car_id, content, image_url? }
        Partner replies: { customer_id, content, image_url? }

    GET  /messages/inquiry/?partner_user_id=<uuid>
        Fetch the thread between the current user and another party.
        Works for both customer (pass partner's user UUID) and partner (pass customer's UUID).

    Inquiry messages: booking=None, neither side is admin.
    Support messages: booking=None, one side is admin.
    These are mutually exclusive and distinguished by admin-id exclusion.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user      = request.user
        content   = request.data.get('content', '').strip()
        image_url = request.data.get('image_url', '').strip() or None

        if not content and not image_url:
            return Response({'error': 'Either content or image_url is required.'}, status=400)

        if user.role == 'customer':
            # Customer sends inquiry via car_id → partner is derived from car
            car_id = request.data.get('car_id', '').strip()
            if not car_id:
                return Response({'error': 'car_id is required.'}, status=400)
            try:
                car = Car.objects.select_related('partner__user').get(pk=car_id)
            except (Car.DoesNotExist, Exception):
                return Response({'error': 'Car not found.'}, status=404)
            partner_user = car.partner.user
            if not partner_user:
                return Response({'error': 'Partner not available.'}, status=404)
            if partner_user.role == 'admin':
                return Response({'error': 'Cannot send inquiry to an admin account.'}, status=400)
            receiver = partner_user

        elif user.role == 'partner':
            # Partner replies to a customer inquiry via customer_id
            customer_id = request.data.get('customer_id', '').strip()
            if not customer_id:
                return Response({'error': 'customer_id is required for partner replies.'}, status=400)
            try:
                receiver = User.objects.get(pk=customer_id)
            except (User.DoesNotExist, Exception):
                return Response({'error': 'Customer not found.'}, status=404)
            if receiver.role != 'customer':
                return Response({'error': 'Receiver must be a customer.'}, status=400)

        else:
            return Response(
                {'error': 'Only customers and partners can use inquiry messaging.'},
                status=403,
            )

        msg = Message.objects.create(
            booking=None,
            sender=user,
            receiver=receiver,
            content=content,
            image_url=image_url,
        )
        return Response(MessageSerializer(msg).data, status=201)

    def get(self, request):
        """Fetch inquiry thread between logged-in user and the given other party."""
        user            = request.user
        partner_user_id = request.query_params.get('partner_user_id', '').strip()

        if not partner_user_id:
            return Response({'error': 'partner_user_id is required.'}, status=400)

        try:
            other_user = User.objects.get(pk=partner_user_id)
        except (User.DoesNotExist, Exception):
            return Response({'error': 'User not found.'}, status=404)

        admin_ids = _admin_ids()

        qs = Message.objects.filter(
            booking__isnull=True
        ).exclude(
            Q(sender_id__in=admin_ids) | Q(receiver_id__in=admin_ids)
        ).filter(
            Q(sender=user, receiver=other_user) |
            Q(sender=other_user, receiver=user)
        ).order_by('created_at')

        qs.filter(receiver=user, is_read=False).update(is_read=True)

        return Response(MessageSerializer(qs, many=True).data)
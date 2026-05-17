from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from ..models import Message, Booking, User, Partner
from ..serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs['booking_id']
        user = self.request.user
        # Mark messages as read when conversation is opened
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


# ─── Support Thread (partner/customer ↔ admin, no booking) ───────────────────

class SupportThreadView(APIView):
    """
    GET  /messages/support/                   → partner/customer sees own thread
    GET  /messages/support/?partner_id=<uuid> → admin fetches a specific partner thread
    POST /messages/support/                   → send a support message
         body (partner): { content }
         body (admin):   { content, receiver_id }
    """
    permission_classes = [IsAuthenticated]

    def _get_admin(self):
        """Return the first admin user as the system support account."""
        return User.objects.filter(role='admin').order_by('created_at').first()

    def get(self, request):
        user = request.user
        partner_id = request.query_params.get('partner_id')

        if user.role == 'admin':
            if partner_id:
                qs = Message.objects.filter(
                    booking__isnull=True,
                    inquiry_partner__isnull=True,
                ).filter(
                    Q(sender_id=partner_id) | Q(receiver_id=partner_id)
                ).order_by('created_at')
                qs.filter(receiver=user, is_read=False).update(is_read=True)
            else:
                qs = Message.objects.filter(
                    booking__isnull=True,
                    inquiry_partner__isnull=True,
                ).order_by('created_at')
        else:
            qs = Message.objects.filter(
                booking__isnull=True,
                inquiry_partner__isnull=True,
            ).filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('created_at')
            Message.objects.filter(
                booking__isnull=True,
                inquiry_partner__isnull=True,
                receiver=user,
                is_read=False,
            ).update(is_read=True)

        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request):
        user = request.user
        content  = request.data.get('content', '').strip()
        _raw_img = request.data.get('image_url')
        image_url = _raw_img.strip() if isinstance(_raw_img, str) else None

        if not content and not image_url:
            return Response({'error': 'Either content or image_url is required.'}, status=400)

        if user.role == 'admin':
            partner_id = request.data.get('receiver_id')
            if not partner_id:
                return Response({'error': 'receiver_id is required for admin replies.'}, status=400)
            try:
                receiver = User.objects.get(pk=partner_id)
            except (User.DoesNotExist, Exception):
                return Response({'error': 'Receiver not found.'}, status=404)
        else:
            receiver = self._get_admin()
            if not receiver:
                return Response(
                    {'error': 'No admin is available right now. Please try again later.'},
                    status=503
                )

        msg = Message.objects.create(
            booking=None,
            inquiry_partner=None,
            sender=user,
            receiver=receiver,
            content=content,
            image_url=image_url,
        )
        return Response(MessageSerializer(msg).data, status=201)


# ─── Inquiry Thread (customer/partner ↔ partner, pre-booking) ─────────────────

class InquiryThreadView(APIView):
    """
    Isolated pre-booking inquiry between any authenticated user and a partner.
    Distinct from support (inquiry_partner is set; booking is null).

    GET  /messages/inquiry/?partner_id=<partner_pk>
    POST /messages/inquiry/   body: { partner_id, content, image_url? }
    """
    permission_classes = [IsAuthenticated]

    def _resolve_partner(self, partner_id):
        try:
            return Partner.objects.select_related('user').get(pk=partner_id)
        except (Partner.DoesNotExist, Exception):
            return None

    def get(self, request):
        user = request.user
        partner_id = request.query_params.get('partner_id')

        if not partner_id:
            return Response({'error': 'partner_id query param is required.'}, status=400)

        partner = self._resolve_partner(partner_id)
        if not partner:
            return Response({'error': 'Partner not found.'}, status=404)

        partner_user = partner.user

        qs = Message.objects.filter(
            booking__isnull=True,
            inquiry_partner=partner,
        ).filter(
            Q(sender=user) | Q(receiver=user) |
            Q(sender=partner_user) | Q(receiver=partner_user)
        ).distinct().order_by('created_at')

        qs.filter(receiver=user, is_read=False).update(is_read=True)

        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request):
        user = request.user
        partner_id = request.data.get('partner_id')
        content  = request.data.get('content', '').strip()
        _raw_img = request.data.get('image_url')
        image_url = _raw_img.strip() if isinstance(_raw_img, str) else None

        if not partner_id:
            return Response({'error': 'partner_id is required.'}, status=400)
        if not content and not image_url:
            return Response({'error': 'Either content or image_url is required.'}, status=400)

        partner = self._resolve_partner(partner_id)
        if not partner:
            return Response({'error': 'Partner not found.'}, status=404)

        partner_user = partner.user

        if user.id == partner_user.id:
            return Response({'error': 'You cannot send an inquiry to yourself.'}, status=400)

        # Customer / other user → send to partner's user account.
        # (Partner's reply path is handled by the partner sending to the inquirer
        #  which happens when they open the thread from their inbox.)
        receiver = partner_user

        msg = Message.objects.create(
            booking=None,
            inquiry_partner=partner,
            sender=user,
            receiver=receiver,
            content=content,
            image_url=image_url,
        )
        return Response(MessageSerializer(msg).data, status=201)


# ─── Inquiry Reply (partner replies back into an inquiry thread) ──────────────

class InquiryReplyView(APIView):
    """
    POST /messages/inquiry/reply/
    body: { partner_id, receiver_id, content, image_url? }

    Used when the partner, or ANY party, wants to reply inside an existing
    inquiry thread. receiver_id = the user to reply to.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        partner_id  = request.data.get('partner_id')
        receiver_id = request.data.get('receiver_id')
        content  = request.data.get('content', '').strip()
        _raw_img = request.data.get('image_url')
        image_url = _raw_img.strip() if isinstance(_raw_img, str) else None

        if not partner_id or not receiver_id:
            return Response({'error': 'partner_id and receiver_id are required.'}, status=400)
        if not content and not image_url:
            return Response({'error': 'Either content or image_url is required.'}, status=400)

        try:
            partner = Partner.objects.select_related('user').get(pk=partner_id)
        except (Partner.DoesNotExist, Exception):
            return Response({'error': 'Partner not found.'}, status=404)

        try:
            receiver = User.objects.get(pk=receiver_id)
        except (User.DoesNotExist, Exception):
            return Response({'error': 'Receiver not found.'}, status=404)

        msg = Message.objects.create(
            booking=None,
            inquiry_partner=partner,
            sender=user,
            receiver=receiver,
            content=content,
            image_url=image_url,
        )
        return Response(MessageSerializer(msg).data, status=201)


# ─── Conversation List (bookings + support + inquiry threads) ─────────────────

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ── 1. Booking-based conversations ──────────────────────────────────
        bookings = Booking.objects.filter(
            Q(customer=user) | Q(partner__user=user)
        ).select_related('car', 'customer', 'partner', 'partner__user')

        conversations = []
        for booking in bookings:
            booking_messages = Message.objects.filter(booking=booking).order_by('-created_at')
            last_message = booking_messages.first()
            unread_count = booking_messages.filter(receiver=user, is_read=False).count()

            if user.role == 'customer':
                other_user_obj = booking.partner.user
                other_name = booking.partner.business_name or other_user_obj.full_name
            else:
                other_user_obj = booking.customer
                other_name = other_user_obj.full_name

            conversations.append({
                'type':            'booking',
                'booking_id':      str(booking.id),
                'booking_code':    booking.booking_code,
                'car_name':        booking.car.name,
                'customer_name':   booking.customer.full_name,
                'partner_name':    booking.partner.business_name,
                'customer_id':     str(booking.customer_id),
                'partner_user_id': str(booking.partner.user_id),
                'other_user': {
                    'id':         str(other_user_obj.id),
                    'full_name':  other_name,
                    'avatar_url': other_user_obj.avatar_url or '',
                },
                'unread_count':    unread_count,
                'last_message': {
                    'content':    last_message.content,
                    'created_at': last_message.created_at,
                    'sender_id':  str(last_message.sender_id),
                } if last_message else None,
            })

        conversations.sort(
            key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
            reverse=True
        )

        # ── 2. Support thread ────────────────────────────────────────────────
        if user.role == 'admin':
            support_msgs_all = (
                Message.objects
                .filter(booking__isnull=True, inquiry_partner__isnull=True)
                .select_related('sender', 'receiver')
                .order_by('created_at')
            )
            seen_partner_ids = set()
            support_convs = []
            for msg in support_msgs_all:
                other = msg.receiver if msg.sender.role == 'admin' else msg.sender
                if other.id in seen_partner_ids:
                    continue
                seen_partner_ids.add(other.id)

                thread_qs = Message.objects.filter(
                    booking__isnull=True,
                    inquiry_partner__isnull=True,
                ).filter(
                    Q(sender=other) | Q(receiver=other)
                ).order_by('-created_at')
                last = thread_qs.first()
                unread = thread_qs.filter(receiver=user, is_read=False).count()

                support_convs.append({
                    'type':               'support',
                    'booking_id':         f'support:{other.id}',
                    'booking_code':       'Support',
                    'car_name':           'Sakyan Support',
                    'customer_name':      other.full_name,
                    'partner_name':       'Sakyan Support',
                    'customer_id':        str(other.id),
                    'partner_user_id':    str(user.id),
                    'is_support':         True,
                    'support_partner_id': str(other.id),
                    'other_user': {
                        'id':         str(other.id),
                        'full_name':  other.full_name,
                        'avatar_url': other.avatar_url or '',
                    },
                    'unread_count':       unread,
                    'last_message': {
                        'content':    last.content,
                        'created_at': last.created_at,
                        'sender_id':  str(last.sender_id),
                    } if last else None,
                })

            support_convs.sort(
                key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
                reverse=True
            )
            conversations = support_convs + conversations

        else:
            support_msgs = Message.objects.filter(
                booking__isnull=True,
                inquiry_partner__isnull=True,
            ).filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('-created_at')
            last_support   = support_msgs.first()
            unread_support = support_msgs.filter(receiver=user, is_read=False).count()

            admin_user = User.objects.filter(role='admin').order_by('created_at').first()
            admin_id   = str(admin_user.id) if admin_user else ''

            support_entry = {
                'type':            'support',
                'booking_id':      'support',
                'booking_code':    'Support',
                'car_name':        'Sakyan Support',
                'customer_name':   'Sakyan Support',
                'partner_name':    'Sakyan Support',
                'customer_id':     str(user.id),
                'partner_user_id': admin_id,
                'is_support':      True,
                'other_user': {
                    'id':         admin_id,
                    'full_name':  'Sakyan Support',
                    'avatar_url': '',
                },
                'unread_count':    unread_support,
                'last_message': {
                    'content':    last_support.content,
                    'created_at': last_support.created_at,
                    'sender_id':  str(last_support.sender_id),
                } if last_support else None,
            }
            conversations = [support_entry] + conversations

        # ── 3. Inquiry threads ───────────────────────────────────────────────
        inquiry_msgs_seed = (
            Message.objects
            .filter(booking__isnull=True, inquiry_partner__isnull=False)
            .filter(Q(sender=user) | Q(receiver=user))
            .select_related('inquiry_partner', 'inquiry_partner__user', 'sender', 'receiver')
            .order_by('created_at')
        )

        seen_inquiry_partner_ids = set()
        inquiry_convs = []

        for msg in inquiry_msgs_seed:
            partner = msg.inquiry_partner
            if partner.id in seen_inquiry_partner_ids:
                continue
            seen_inquiry_partner_ids.add(partner.id)

            partner_user = partner.user

            thread_qs = Message.objects.filter(
                booking__isnull=True,
                inquiry_partner=partner,
            ).filter(
                Q(sender=user) | Q(receiver=user) |
                Q(sender=partner_user) | Q(receiver=partner_user)
            ).distinct().order_by('-created_at')

            last   = thread_qs.first()
            unread = thread_qs.filter(receiver=user, is_read=False).count()

            # Determine the "other" person from this user's perspective
            if user.id == partner_user.id:
                # This user IS the partner → show who inquired
                first_outside = (
                    Message.objects
                    .filter(booking__isnull=True, inquiry_partner=partner)
                    .exclude(sender=partner_user)
                    .select_related('sender')
                    .order_by('created_at')
                    .first()
                )
                other_user_obj = first_outside.sender if first_outside else user
                other_name     = other_user_obj.full_name
                other_id       = str(other_user_obj.id)
            else:
                # This user is the inquirer → show the partner
                other_user_obj = partner_user
                other_name     = partner.business_name or partner_user.full_name
                other_id       = str(partner_user.id)

            inquiry_convs.append({
                'type':            'inquiry',
                'booking_id':      f'inquiry:{partner.id}',
                'booking_code':    'Inquiry',
                'car_name':        partner.business_name,
                'customer_name':   other_name,
                'partner_name':    partner.business_name,
                'customer_id':     str(user.id),
                'partner_user_id': str(partner_user.id),
                'partner_id':      str(partner.id),
                'is_inquiry':      True,
                'other_user': {
                    'id':         other_id,
                    'full_name':  other_name,
                    'avatar_url': other_user_obj.avatar_url or '',
                },
                'unread_count':    unread,
                'last_message': {
                    'content':    last.content,
                    'created_at': last.created_at,
                    'sender_id':  str(last.sender_id),
                } if last else None,
            })

        inquiry_convs.sort(
            key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
            reverse=True
        )
        conversations = conversations + inquiry_convs

        return Response(conversations)
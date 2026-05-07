from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from ..models import Message, Booking, User
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
        serializer.save(sender=self.request.user)


# ─── Support Thread (partner ↔ admin, no booking) ────────────────────────────

class SupportThreadView(APIView):
    """
    GET  /messages/support/          → return support messages for the current user
    GET  /messages/support/?partner_id=<uuid> → admin fetches a specific partner's thread
    POST /messages/support/          → send a support message
    """
    permission_classes = [IsAuthenticated]

    def _get_admin(self):
        """Return the first admin user (used as the system support account)."""
        return User.objects.filter(role='admin').order_by('created_at').first()

    def get(self, request):
        user = request.user
        partner_id = request.query_params.get('partner_id')

        if user.role == 'admin':
            if partner_id:
                # Admin views a specific partner's thread
                qs = Message.objects.filter(
                    Q(sender_id=partner_id) | Q(receiver_id=partner_id),
                    booking__isnull=True,
                ).order_by('created_at')
            else:
                # Admin gets list of all partners who have support threads
                # Return latest message per unique partner
                qs = Message.objects.filter(booking__isnull=True).order_by('created_at')
        else:
            qs = Message.objects.filter(
                Q(sender=user) | Q(receiver=user),
                booking__isnull=True,
            ).order_by('created_at')
            # Mark incoming as read
            Message.objects.filter(
                Q(sender=user) | Q(receiver=user),
                booking__isnull=True,
                receiver=user,
                is_read=False,
            ).update(is_read=True)

        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request):
        user = request.user
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Content is required.'}, status=400)

        if user.role == 'admin':
            # Admin replies to a specific partner
            partner_id = request.data.get('receiver_id')
            if not partner_id:
                return Response({'error': 'receiver_id is required for admin replies.'}, status=400)
            try:
                receiver = User.objects.get(pk=partner_id)
            except User.DoesNotExist:
                return Response({'error': 'Receiver not found.'}, status=404)
        else:
            # Partner/customer messages the first admin
            receiver = self._get_admin()
            if not receiver:
                return Response({'error': 'No admin available.'}, status=503)

        msg = Message.objects.create(
            booking=None,
            sender=user,
            receiver=receiver,
            content=content,
        )
        return Response(MessageSerializer(msg).data, status=201)


# ─── Conversation List (booking threads + support thread) ─────────────────────

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ── 1. Booking-based conversations (existing logic) ──
        bookings = Booking.objects.filter(
            Q(customer=user) | Q(partner__user=user)
        ).select_related('car', 'customer', 'partner', 'partner__user') \
         .prefetch_related('messages')

        conversations = []
        for booking in bookings:
            last_message = booking.messages.order_by('-created_at').first()
            unread_count = booking.messages.filter(
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

        # Sort booking conversations newest first
        conversations.sort(
            key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
            reverse=True
        )

        # ── 2. Support thread ──
        # Partners/customers always see "Sakyan Support" at the top.
        # Admins see ALL partner support threads grouped by the non-admin party.
        if user.role == 'admin':
            # Build one entry per unique non-admin user who has a support thread
            support_qs = Message.objects.filter(booking__isnull=True).select_related('sender', 'receiver').order_by('created_at')
            seen_partner_ids = set()
            support_convs = []
            for msg in support_qs:
                other = msg.receiver if msg.sender.role == 'admin' else msg.sender
                if other.id in seen_partner_ids:
                    continue
                seen_partner_ids.add(other.id)
                # Get last message and unread for this thread
                thread_qs = Message.objects.filter(
                    Q(sender=other) | Q(receiver=other),
                    booking__isnull=True,
                ).order_by('-created_at')
                last = thread_qs.first()
                unread = thread_qs.filter(receiver=user, is_read=False).count()
                support_convs.append({
                    'booking_id':      f'support:{other.id}',   # virtual ID
                    'booking_code':    'Support',
                    'car_name':        'Sakyan Support',
                    'customer_name':   other.full_name,
                    'partner_name':    'Sakyan Support',
                    'customer_id':     str(other.id),
                    'partner_user_id': str(user.id),
                    'is_support':      True,
                    'support_partner_id': str(other.id),
                    'unread_count':    unread,
                    'last_message': {
                        'content':    last.content,
                        'created_at': last.created_at,
                        'sender_id':  str(last.sender_id),
                    } if last else None,
                })
            # Sort support threads newest first
            support_convs.sort(
                key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
                reverse=True
            )
            conversations = support_convs + conversations
        else:
            # For partner/customer: one "Sakyan Support" pinned entry
            support_msgs = Message.objects.filter(
                Q(sender=user) | Q(receiver=user),
                booking__isnull=True,
            ).order_by('-created_at')
            last_support = support_msgs.first()
            unread_support = support_msgs.filter(receiver=user, is_read=False).count()

            support_entry = {
                'booking_id':      'support',   # sentinel value the frontend checks for
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
            # Pin support at the top
            conversations = [support_entry] + conversations

        return Response(conversations)
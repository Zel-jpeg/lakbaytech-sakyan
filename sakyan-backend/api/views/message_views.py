from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from ..models import Message, Booking
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


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

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

                # Added — ConversationList needs both names separately
                # to display the right one depending on the viewer's role
                'customer_name':   booking.customer.full_name,
                'partner_name':    booking.partner.business_name,

                # Added — ChatWindow uses these to resolve receiver_id
                # user.id === booking.customer_id → receiver = partner_user_id
                # user.id === booking.partner_user_id → receiver = customer_id
                'customer_id':     str(booking.customer_id),
                'partner_user_id': str(booking.partner.user_id),

                'unread_count':    unread_count,

                # Changed — was a flat string, now a dict so ConversationList
                # can display both the content and the timestamp
                'last_message': {
                    'content':    last_message.content,
                    'created_at': last_message.created_at,
                    'sender_id':  str(last_message.sender_id),
                } if last_message else None,
            })

        # Added — sort newest conversation first
        conversations.sort(
            key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
            reverse=True
        )

        return Response(conversations)
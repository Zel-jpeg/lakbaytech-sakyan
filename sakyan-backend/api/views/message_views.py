from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from ..models import Message, Booking
from ..serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs['booking_id']
        user = self.request.user
        # Mark messages as read
        Message.objects.filter(
            booking_id=booking_id,
            receiver=user,
            is_read=False
        ).update(is_read=True)
        return Message.objects.filter(booking_id=booking_id)


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
        ).select_related('car', 'customer', 'partner', 'partner__user')

        conversations = []
        for booking in bookings:
            last_message = booking.messages.last()
            unread_count = booking.messages.filter(
                receiver=user, is_read=False
            ).count()
            conversations.append({
                'booking_id':   str(booking.id),
                'booking_code': booking.booking_code,
                'car_name':     booking.car.name,
                'other_party':  (
                    booking.partner.user.full_name
                    if user == booking.customer
                    else booking.customer.full_name
                ),
                'last_message': last_message.content if last_message else None,
                'last_message_at': last_message.created_at if last_message else None,
                'unread_count': unread_count,
            })
        return Response(conversations)
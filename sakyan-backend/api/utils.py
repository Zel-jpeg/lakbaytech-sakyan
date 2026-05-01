def push_notification(user_id, title, message, notification_type='general', reference_id=None):
    """
    Write a notification row. Supabase Realtime broadcasts the INSERT
    automatically to any subscribed frontend client — no Redis needed.

    Usage:
        push_notification(
            user_id=booking.customer_id,
            title='Booking Approved! ✅',
            message='Your booking SKY-001 has been approved.',
            notification_type='booking',
            reference_id=str(booking.id)
        )
    """
    from api.models import Notification

    Notification.objects.create(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        reference_id=reference_id,
    )
    # That's it. Supabase detects the INSERT and pushes it to the frontend.
    # No channel_layer, no async_to_sync, no group_send.
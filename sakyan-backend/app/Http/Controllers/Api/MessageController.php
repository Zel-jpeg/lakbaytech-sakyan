<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\Booking;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * GET /api/messages/{booking_id}
     * Get all messages for a specific booking.
     * Marks messages as read for the current user.
     */
    public function index(Request $request, string $bookingId)
    {
        $user    = SupabaseAuth::user($request);
        $booking = Booking::findOrFail($bookingId);

        // Ensure user is part of this booking
        $this->authorizeBookingAccess($user, $booking);

        // Mark messages sent to this user as read
        Message::where('booking_id', $bookingId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::with('sender:id,full_name,avatar_url')
            ->where('booking_id', $bookingId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['message' => 'Success', 'data' => $messages]);
    }

    /**
     * POST /api/messages
     * Send a message on a booking thread.
     */
    public function store(Request $request)
    {
        $user = SupabaseAuth::user($request);

        $data = $request->validate([
            'booking_id' => 'required|uuid|exists:bookings,id',
            'content'    => 'required|string|max:2000',
        ]);

        $booking = Booking::findOrFail($data['booking_id']);
        $this->authorizeBookingAccess($user, $booking);

        // Determine receiver (the other party)
        $partner   = Partner::where('user_id', $user->id)->first();
        $isSenderPartner = $partner && $booking->partner_id === $partner->id;
        $receiverId = $isSenderPartner ? $booking->customer_id : $booking->partner->user_id;

        $message = Message::create([
            'booking_id'  => $data['booking_id'],
            'sender_id'   => $user->id,
            'receiver_id' => $receiverId,
            'content'     => $data['content'],
            'is_read'     => false,
            'created_at'  => now(),
        ]);

        // Notify receiver
        Notification::create([
            'user_id'      => $receiverId,
            'title'        => 'New Message 💬',
            'message'      => substr($data['content'], 0, 100),
            'type'         => 'message',
            'reference_id' => $booking->id,
            'created_at'   => now(),
        ]);

        return response()->json([
            'message' => 'Message sent',
            'data'    => $message->load('sender:id,full_name,avatar_url'),
        ], 201);
    }

    /**
     * GET /api/messages/conversations
     * List all booking conversations for the current user.
     */
    public function conversations(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->first();

        if ($partner) {
            // Partner sees bookings they're part of
            $bookings = Booking::with(['car:id,name', 'customer:id,full_name,avatar_url'])
                ->where('partner_id', $partner->id)
                ->whereIn('booking_status', ['approved', 'active', 'completed'])
                ->orderBy('updated_at', 'desc')
                ->get();
        } else {
            // Customer sees their own bookings
            $bookings = Booking::with(['car:id,name', 'partner:id,business_name'])
                ->where('customer_id', $user->id)
                ->whereIn('booking_status', ['approved', 'active', 'completed'])
                ->orderBy('updated_at', 'desc')
                ->get();
        }

        // Attach unread count per booking
        $result = $bookings->map(function ($booking) use ($user) {
            $unread = Message::where('booking_id', $booking->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
            $booking->unread_count = $unread;

            $last = Message::where('booking_id', $booking->id)
                ->orderBy('created_at', 'desc')
                ->first();
            $booking->last_message = $last?->content;
            $booking->last_message_at = $last?->created_at;

            return $booking;
        });

        return response()->json(['message' => 'Success', 'data' => $result]);
    }

    /** Ensure user is customer or partner of this booking */
    private function authorizeBookingAccess(User $user, Booking $booking): void
    {
        $partner = Partner::where('user_id', $user->id)->first();
        $allowed = $booking->customer_id === $user->id
            || ($partner && $booking->partner_id === $partner->id)
            || $user->role === 'admin';

        if (!$allowed) {
            abort(403, 'You are not part of this booking conversation.');
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\AppSetting;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CustomerProfile;
use App\Models\Notification;
use App\Models\Partner;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * POST /api/bookings
     * Customer — create a new booking.
     * Booking fee is fetched from app_settings (admin-configurable).
     */
    public function store(Request $request)
    {
        $user = SupabaseAuth::user($request);

        $data = $request->validate([
            'car_id'          => 'required|uuid|exists:cars,id',
            'start_date'      => 'required|date|after_or_equal:today',
            'end_date'        => 'required|date|after:start_date',
            'pickup_location' => 'nullable|string',
            'return_location' => 'nullable|string',
            'payment_method'  => 'required|in:gcash,cash',
            'gcash_reference' => 'required_if:payment_method,gcash|nullable|string|max:100',
            'special_requests'=> 'nullable|string',
        ]);

        $car = Car::with('partner')->findOrFail($data['car_id']);

        if (!$car->is_available || $car->status !== 'active') {
            return response()->json(['error' => 'This car is not available for booking'], 422);
        }

        // ── Financial calculations ────────────────────
        $startDate  = new \DateTime($data['start_date']);
        $endDate    = new \DateTime($data['end_date']);
        $totalDays  = (int) $startDate->diff($endDate)->days;

        $pricePerDay      = (float) $car->price_per_day;
        $subtotal         = $pricePerDay * $totalDays;
        $bookingFee       = (float) AppSetting::get('booking_fee', 100); // Admin-set ₱80–₱150
        $commissionRate   = (float) $car->partner->commission_rate / 100; // e.g., 0.10
        $commissionAmount = $subtotal * $commissionRate;
        $totalAmount      = $subtotal + $bookingFee; // What customer pays
        $partnerNet       = $subtotal - $commissionAmount; // What partner earns

        // ── Generate booking code ─────────────────────
        $bookingCode = 'SKY-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        $booking = Booking::create([
            'booking_code'     => $bookingCode,
            'car_id'           => $car->id,
            'customer_id'      => $user->id,
            'partner_id'       => $car->partner_id,
            'start_date'       => $data['start_date'],
            'end_date'         => $data['end_date'],
            'pickup_location'  => $data['pickup_location'] ?? $car->location,
            'return_location'  => $data['return_location'] ?? $car->location,
            'total_days'       => $totalDays,
            'price_per_day'    => $pricePerDay,
            'subtotal'         => $subtotal,
            'booking_fee'      => $bookingFee,
            'commission_amount'=> $commissionAmount,
            'total_amount'     => $totalAmount,
            'partner_net'      => $partnerNet,
            'payment_method'   => $data['payment_method'],
            'gcash_reference'  => $data['gcash_reference'] ?? null,
            'special_requests' => $data['special_requests'] ?? null,
            'booking_status'   => 'pending_review',
            'payment_status'   => 'pending',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // ── Notify partner ────────────────────────────
        $partnerUser = $car->partner->user;
        if ($partnerUser) {
            Notification::create([
                'user_id'      => $partnerUser->id,
                'title'        => 'New Booking Request 🚗',
                'message'      => "New booking #{$bookingCode} for your {$car->name}.",
                'type'         => 'booking',
                'reference_id' => $booking->id,
                'created_at'   => now(),
            ]);
        }

        return response()->json([
            'message' => 'Booking submitted successfully',
            'data'    => $booking->load(['car:id,name,location', 'customer:id,full_name,email']),
        ], 201);
    }

    /**
     * GET /api/bookings/my
     * Customer — list own bookings.
     */
    public function myBookings(Request $request)
    {
        $user = SupabaseAuth::user($request);

        $bookings = Booking::with(['car:id,name,location', 'car.primaryImage'])
            ->where('customer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['message' => 'Success', 'data' => $bookings]);
    }

    /**
     * GET /api/bookings/partner
     * Partner — list incoming bookings with customer info.
     */
    public function partnerBookings(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();

        $bookings = Booking::with([
            'car:id,name,plate_number,location',
            'customer:id,full_name,email,phone',
            'customer.customerProfile',
        ])
            ->where('partner_id', $partner->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['message' => 'Success', 'data' => $bookings]);
    }

    /**
     * GET /api/bookings/{id}
     * Customer or Partner — single booking detail.
     */
    public function show(Request $request, string $id)
    {
        $user    = SupabaseAuth::user($request);
        $booking = Booking::with([
            'car', 'car.images',
            'customer:id,full_name,email,phone',
            'customer.customerProfile',
            'partner:id,business_name,contact_phone',
        ])->findOrFail($id);

        // Ensure user can only see own bookings
        $partner = Partner::where('user_id', $user->id)->first();
        $isOwner = $booking->customer_id === $user->id
            || ($partner && $booking->partner_id === $partner->id)
            || $user->role === 'admin';

        if (!$isOwner) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json(['message' => 'Success', 'data' => $booking]);
    }

    /**
     * PATCH /api/bookings/{id}/approve
     * Partner — approve a booking.
     */
    public function approve(Request $request, string $id)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();
        $booking = Booking::where('id', $id)
            ->where('partner_id', $partner->id)
            ->where('booking_status', 'pending_review')
            ->firstOrFail();

        $booking->update(['booking_status' => 'approved', 'updated_at' => now()]);

        // Notify customer
        Notification::create([
            'user_id'      => $booking->customer_id,
            'title'        => 'Booking Approved! ✅',
            'message'      => "Your booking #{$booking->booking_code} has been approved.",
            'type'         => 'booking',
            'reference_id' => $booking->id,
            'created_at'   => now(),
        ]);

        return response()->json(['message' => 'Booking approved', 'data' => $booking]);
    }

    /**
     * PATCH /api/bookings/{id}/reject
     * Partner — reject a booking.
     */
    public function reject(Request $request, string $id)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();
        $booking = Booking::where('id', $id)
            ->where('partner_id', $partner->id)
            ->whereIn('booking_status', ['pending_review', 'approved'])
            ->firstOrFail();

        $request->validate(['reason' => 'nullable|string']);

        $booking->update([
            'booking_status' => 'rejected',
            'admin_notes'    => $request->reason,
            'updated_at'     => now(),
        ]);

        Notification::create([
            'user_id'      => $booking->customer_id,
            'title'        => 'Booking Rejected ❌',
            'message'      => "Your booking #{$booking->booking_code} was rejected. " . ($request->reason ?? ''),
            'type'         => 'booking',
            'reference_id' => $booking->id,
            'created_at'   => now(),
        ]);

        return response()->json(['message' => 'Booking rejected', 'data' => $booking]);
    }

    /**
     * PATCH /api/bookings/{id}/cancel
     * Customer — cancel own booking.
     */
    public function cancel(Request $request, string $id)
    {
        $user    = SupabaseAuth::user($request);
        $booking = Booking::where('id', $id)
            ->where('customer_id', $user->id)
            ->whereIn('booking_status', ['pending_review', 'approved'])
            ->firstOrFail();

        $booking->update(['booking_status' => 'cancelled', 'updated_at' => now()]);

        return response()->json(['message' => 'Booking cancelled', 'data' => $booking]);
    }

    /**
     * POST /api/bookings/kyc
     * Customer — save/update KYC profile (license, valid ID).
     */
    public function saveKyc(Request $request)
    {
        $user = SupabaseAuth::user($request);

        $data = $request->validate([
            'birthday'                 => 'required|date',
            'address'                  => 'required|string',
            'drivers_license_number'   => 'required|string|max:50',
            'drivers_license_url'      => 'required|url',
            'license_expiry'           => 'nullable|date',
            'valid_id_type'            => 'nullable|string',
            'valid_id_url'             => 'nullable|url',
            'selfie_url'               => 'nullable|url',
        ]);

        $profile = CustomerProfile::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($data, ['updated_at' => now()])
        );

        return response()->json(['message' => 'KYC saved', 'data' => $profile]);
    }

    /**
     * GET /api/bookings/fee
     * Public — get current booking fee (for checkout display).
     */
    public function getFee()
    {
        $fee = (float) AppSetting::get('booking_fee', 100);
        return response()->json(['message' => 'Success', 'data' => ['booking_fee' => $fee]]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\AppSetting;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * GET /api/admin/partners?status=pending
     * List partner applications filtered by status.
     */
    public function partners(Request $request)
    {
        $status   = $request->get('status', 'pending');
        $partners = Partner::with('user:id,full_name,email,phone')
            ->when($status !== 'all', fn($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['message' => 'Success', 'data' => $partners]);
    }

    /**
     * PATCH /api/admin/partners/{id}/approve
     * Approve a partner application.
     */
    public function approvePartner(Request $request, string $id)
    {
        $admin   = SupabaseAuth::user($request);
        $partner = Partner::findOrFail($id);

        $partner->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        // Promote user role to 'partner'
        User::where('id', $partner->user_id)->update(['role' => 'partner', 'updated_at' => now()]);

        Notification::create([
            'user_id'    => $partner->user_id,
            'title'      => 'Application Approved! 🎉',
            'message'    => 'Congratulations! Your Sakyan partner application has been approved. You can now start listing your cars.',
            'type'       => 'approval',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Partner approved successfully']);
    }

    /**
     * PATCH /api/admin/partners/{id}/reject
     * Reject a partner application with optional reason.
     */
    public function rejectPartner(Request $request, string $id)
    {
        $request->validate(['reason' => 'nullable|string']);

        $partner = Partner::findOrFail($id);
        $partner->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        Notification::create([
            'user_id'    => $partner->user_id,
            'title'      => 'Application Not Approved ❌',
            'message'    => 'Your Sakyan partner application was not approved. ' . ($request->reason ?? 'Please contact support for details.'),
            'type'       => 'approval',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Partner rejected']);
    }

    /**
     * PATCH /api/admin/partners/{id}/suspend
     * Suspend a partner.
     */
    public function suspendPartner(Request $request, string $id)
    {
        $partner = Partner::findOrFail($id);
        $partner->update(['status' => 'suspended']);
        User::where('id', $partner->user_id)->update(['role' => 'customer', 'updated_at' => now()]);

        return response()->json(['message' => 'Partner suspended']);
    }

    /**
     * GET /api/admin/bookings
     * List all bookings with optional filters.
     */
    public function bookings(Request $request)
    {
        $query = Booking::with([
            'car:id,name',
            'customer:id,full_name,email',
            'partner:id,business_name',
        ])->orderBy('created_at', 'desc');

        if ($request->status) {
            $query->where('booking_status', $request->status);
        }
        if ($request->partner_id) {
            $query->where('partner_id', $request->partner_id);
        }

        return response()->json(['message' => 'Success', 'data' => $query->paginate(20)]);
    }

    /**
     * GET /api/admin/users
     * List all users.
     */
    public function users(Request $request)
    {
        $users = User::when($request->role, fn($q) => $q->where('role', $request->role))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['message' => 'Success', 'data' => $users]);
    }

    /**
     * GET /api/admin/stats
     * Platform-wide stats for the admin dashboard.
     */
    public function stats()
    {
        $stats = [
            'total_bookings'     => Booking::count(),
            'pending_bookings'   => Booking::where('booking_status', 'pending_review')->count(),
            'completed_bookings' => Booking::where('booking_status', 'completed')->count(),
            'total_partners'     => Partner::where('status', 'approved')->count(),
            'pending_partners'   => Partner::where('status', 'pending')->count(),
            'total_customers'    => User::where('role', 'customer')->count(),
            'total_revenue'      => Booking::where('booking_status', 'completed')->sum('booking_fee'),
            'total_commission'   => Booking::where('booking_status', 'completed')->sum('commission_amount'),
            'booking_fee'        => (float) AppSetting::get('booking_fee', 100),
        ];

        return response()->json(['message' => 'Success', 'data' => $stats]);
    }

    /**
     * GET /api/admin/settings
     * List all configurable settings.
     */
    public function getSettings()
    {
        $settings = AppSetting::all()->pluck('value', 'key');
        return response()->json(['message' => 'Success', 'data' => $settings]);
    }

    /**
     * PUT /api/admin/settings
     * Update a setting (e.g., booking fee).
     * Body: { "key": "booking_fee", "value": "120" }
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'key'   => 'required|string',
            'value' => 'required|string',
        ]);

        // Validate booking_fee range
        if ($data['key'] === 'booking_fee') {
            $fee = (float) $data['value'];
            if ($fee < 80 || $fee > 150) {
                return response()->json(['error' => 'Booking fee must be between ₱80 and ₱150'], 422);
            }
        }

        AppSetting::set($data['key'], $data['value']);

        return response()->json([
            'message' => 'Setting updated',
            'data'    => ['key' => $data['key'], 'value' => $data['value']],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\Notification;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    /**
     * POST /api/partners/apply
     * Authenticated customer — submit partner application.
     */
    public function apply(Request $request)
    {
        $user = SupabaseAuth::user($request);

        // Prevent duplicate applications
        $existing = Partner::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();
        if ($existing) {
            return response()->json(['error' => 'You already have an active or pending application'], 422);
        }

        $data = $request->validate([
            'business_name'       => 'required|string|max:255',
            'partner_type'        => 'required|in:individual,company',
            'business_address'    => 'required|string',
            'contact_person'      => 'required|string|max:255',
            'contact_phone'       => 'required|string|max:20',
            'government_id_url'   => 'required|url',
            'business_permit_url' => 'nullable|url',
        ]);

        $partner = Partner::create([
            ...$data,
            'user_id'    => $user->id,
            'status'     => 'pending',
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted! Awaiting admin approval (24–48 hrs).',
            'data'    => $partner,
        ], 201);
    }

    /**
     * GET /api/partners/me
     * Partner — get own partner profile.
     */
    public function me(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();

        return response()->json(['message' => 'Success', 'data' => $partner]);
    }

    /**
     * PUT /api/partners/me
     * Partner — update own partner profile.
     */
    public function update(Request $request)
    {
        $user    = SupabaseAuth::user($request);
        $partner = Partner::where('user_id', $user->id)->firstOrFail();

        $data = $request->validate([
            'business_name'    => 'sometimes|string|max:255',
            'business_address' => 'sometimes|string',
            'contact_person'   => 'sometimes|string',
            'contact_phone'    => 'sometimes|string|max:20',
        ]);

        $partner->update($data);

        return response()->json(['message' => 'Profile updated', 'data' => $partner->fresh()]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SupabaseAuth;
use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     * Called after Supabase signUp to create the user record in our DB.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'user_id'   => 'required|string',
            'email'     => 'required|email',
            'full_name' => 'required|string|max:255',
            'phone'     => 'nullable|string|max:20',
        ]);

        // Upsert — if user already exists (e.g., Google login hit first), just update
        $user = User::updateOrCreate(
            ['id' => $data['user_id']],
            [
                'email'      => $data['email'],
                'full_name'  => $data['full_name'],
                'phone'      => $data['phone'] ?? null,
                'role'       => 'customer',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'User registered successfully',
            'data'    => $user,
        ], 201);
    }

    /**
     * GET /api/auth/me
     * Returns the authenticated user with partner profile if applicable.
     */
    public function me(Request $request)
    {
        $user = SupabaseAuth::user($request);

        // Load partner profile if partner role
        if ($user->role === 'partner') {
            $user->load('partner');
        }

        return response()->json([
            'message' => 'Success',
            'data'    => $user,
        ]);
    }

    /**
     * POST /api/auth/google/callback
     * Called after Google OAuth to upsert user record (JWT already validated by middleware).
     */
    public function googleCallback(Request $request)
    {
        // User is already created/upserted in SupabaseAuth middleware
        $user = SupabaseAuth::user($request);

        return response()->json([
            'message' => 'Google login successful',
            'data'    => $user,
        ]);
    }

    /**
     * PATCH /api/auth/profile
     * Update current user's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = SupabaseAuth::user($request);

        $data = $request->validate([
            'full_name'  => 'sometimes|string|max:255',
            'phone'      => 'sometimes|string|max:20',
            'avatar_url' => 'sometimes|url',
        ]);

        $data['updated_at'] = now();
        $user->update($data);

        return response()->json([
            'message' => 'Profile updated',
            'data'    => $user->fresh(),
        ]);
    }
}

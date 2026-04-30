<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SupabaseAuth
{
    /**
     * Validate Supabase JWT and attach user to the request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization', '');

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Unauthorized — no token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey  = env('SUPABASE_SERVICE_KEY');

        // Validate token against Supabase Auth
        $ch = curl_init("{$supabaseUrl}/auth/v1/user");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$token}",
                "apikey: {$serviceKey}",
            ],
        ]);
        $body     = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            return response()->json(['error' => 'Unauthorized — invalid or expired token'], 401);
        }

        $supabaseUser = json_decode($body, true);

        if (empty($supabaseUser['id'])) {
            return response()->json(['error' => 'Unauthorized — user not found in auth'], 401);
        }

        // Look up user in our users table
        $user = User::find($supabaseUser['id']);

        if (!$user) {
            // Auto-create user record on first login (e.g., Google OAuth)
            $meta = $supabaseUser['user_metadata'] ?? [];
            $user = User::create([
                'id'        => $supabaseUser['id'],
                'email'     => $supabaseUser['email'],
                'full_name' => $meta['full_name'] ?? $meta['name'] ?? explode('@', $supabaseUser['email'])[0],
                'role'      => 'customer',
                'avatar_url'=> $meta['avatar_url'] ?? $meta['picture'] ?? null,
                'created_at'=> now(),
                'updated_at'=> now(),
            ]);
        }

        // Attach to request
        $request->merge(['__auth_user' => $user]);

        return $next($request);
    }

    /**
     * Helper: get the authenticated user from request.
     */
    public static function user(Request $request): ?User
    {
        return $request->get('__auth_user');
    }
}

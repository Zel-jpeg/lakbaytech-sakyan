<?php

namespace App\Http\Middleware;

use App\Http\Middleware\SupabaseAuth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Usage in routes: middleware('role:admin') or middleware('role:partner,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = SupabaseAuth::user($request);

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'error' => "Forbidden — requires role: " . implode(' or ', $roles)
            ], 403);
        }

        return $next($request);
    }
}

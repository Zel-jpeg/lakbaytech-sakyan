<?php

use App\Http\Middleware\CorsMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SupabaseAuth;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // ── CORS: allow frontend to call this API ──────────────────────────────
        $middleware->prepend(CorsMiddleware::class);

        // ── Register named middleware aliases ──────────────────────────────────
        $middleware->alias([
            'auth.supabase' => SupabaseAuth::class,
            'role'          => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON for all API errors
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                return response()->json([
                    'error' => $e->getMessage() ?: 'Server error',
                ], $status);
            }
        });
    })->create();


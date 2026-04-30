<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PartnerController;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ─────────────────────────────────────────────────────────────────────────────

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);

// Cars — public browsing
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{id}', [CarController::class, 'show']);

// Booking fee — displayed on checkout before login
Route::get('/bookings/fee', [BookingController::class, 'getFee']);


// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED ROUTES (valid Supabase JWT required)
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware('auth.supabase')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/google/callback', [AuthController::class, 'googleCallback']);


    // ── Cars (partner management) ─────────────────────────────────────────────
    Route::middleware('role:partner,admin')->group(function () {
        Route::get('/partner/cars', [CarController::class, 'myCars']);
        Route::post('/cars', [CarController::class, 'store']);
        Route::put('/cars/{id}', [CarController::class, 'update']);
        Route::patch('/cars/{id}/toggle', [CarController::class, 'toggle']);
        Route::delete('/cars/{id}', [CarController::class, 'destroy']);
    });


    // ── Bookings ──────────────────────────────────────────────────────────────

    // Customer booking routes
    Route::middleware('role:customer,admin')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/my', [BookingController::class, 'myBookings']);
        Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/kyc', [BookingController::class, 'saveKyc']);
    });

    // Partner booking routes
    Route::middleware('role:partner,admin')->group(function () {
        Route::get('/bookings/partner', [BookingController::class, 'partnerBookings']);
        Route::patch('/bookings/{id}/approve', [BookingController::class, 'approve']);
        Route::patch('/bookings/{id}/reject', [BookingController::class, 'reject']);
    });

    // Shared booking detail (customer or partner can view their own)
    Route::get('/bookings/{id}', [BookingController::class, 'show']);


    // ── Partners ──────────────────────────────────────────────────────────────
    Route::post('/partners/apply', [PartnerController::class, 'apply']);

    Route::middleware('role:partner,admin')->group(function () {
        Route::get('/partners/me', [PartnerController::class, 'me']);
        Route::put('/partners/me', [PartnerController::class, 'update']);
    });


    // ── Messages ──────────────────────────────────────────────────────────────
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::get('/messages/{booking_id}', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);


    // ── Admin ─────────────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/partners', [AdminController::class, 'partners']);
        Route::patch('/partners/{id}/approve', [AdminController::class, 'approvePartner']);
        Route::patch('/partners/{id}/reject', [AdminController::class, 'rejectPartner']);
        Route::patch('/partners/{id}/suspend', [AdminController::class, 'suspendPartner']);

        Route::get('/bookings', [AdminController::class, 'bookings']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/stats', [AdminController::class, 'stats']);

        // Booking fee & settings
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });
});

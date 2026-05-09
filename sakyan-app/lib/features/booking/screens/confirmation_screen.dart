import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';

class ConfirmationScreen extends StatelessWidget {
  final String bookingCode;
  const ConfirmationScreen({super.key, required this.bookingCode});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Success icon ───────────────────────────────────
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  color:  AppColors.successBg,
                  shape:  BoxShape.circle,
                  border: Border.all(color: AppColors.success.withOpacity(0.3), width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.check_circle_rounded, color: AppColors.success, size: 64),
                ),
              ),
              const SizedBox(height: 28),

              // ── Title ──────────────────────────────────────────
              const Text(
                'Booking Submitted!',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              const Text(
                'Your booking is pending review.\nThe partner will approve or reject shortly.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // ── Booking code card ──────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color:        AppColors.bgSurface,
                  borderRadius: BorderRadius.circular(16),
                  border:       Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    const Text('Booking Code', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    const SizedBox(height: 8),
                    Text(
                      bookingCode,
                      style: const TextStyle(
                        fontSize:      24,
                        fontWeight:    FontWeight.w800,
                        color:         AppColors.primary,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Save this code for reference', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),

              const Spacer(flex: 3),

              // ── Actions ────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go(AppRoutes.bookings),
                  child: const Text('View My Bookings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go(AppRoutes.home),
                  child: const Text('Back to Home', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
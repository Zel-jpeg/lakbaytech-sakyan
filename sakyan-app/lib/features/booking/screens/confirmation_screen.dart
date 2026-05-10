import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';

class ConfirmationScreen extends StatelessWidget {
  final String bookingCode;
  const ConfirmationScreen({super.key, required this.bookingCode});

  @override
  Widget build(BuildContext context) {
    // Read optional extra data passed from checkout
    final extra         = GoRouterState.of(context).extra as Map<String, dynamic>? ?? {};
    final bookingId     = extra['bookingId']     as String?;
    final paymentMethod = extra['paymentMethod'] as String? ?? 'cash';
    final partnerUserId = extra['partnerUserId'] as String? ?? '';
    final partnerName   = extra['partnerName']   as String? ?? 'Partner';
    final carName       = extra['carName']       as String? ?? '';

    final isGcash   = paymentMethod == 'gcash';
    final theme     = Theme.of(context);
    final isDark    = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Success icon ───────────────────────────────────────────
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  color:  AppColors.successBg,
                  shape:  BoxShape.circle,
                  border: Border.all(
                      color: AppColors.success.withOpacity(0.3), width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.check_circle_rounded,
                      color: AppColors.success, size: 64),
                ),
              ),
              const SizedBox(height: 28),

              // ── Title ──────────────────────────────────────────────────
              Text(
                'Booking Submitted!',
                style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: textPrim),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                'Your booking is pending review.\nThe partner will approve or reject shortly.',
                style: TextStyle(
                    color: textSec, fontSize: 14, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // ── Booking code card ──────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color:        cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border:       Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    Text('Booking Code',
                        style: TextStyle(color: textMuted, fontSize: 13)),
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
                    Text('Save this code for reference',
                        style: TextStyle(color: textMuted, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // ── Payment info banner ────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: (isGcash ? AppColors.info : AppColors.success)
                      .withOpacity(isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (isGcash ? AppColors.info : AppColors.success)
                        .withOpacity(0.4),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      isGcash ? Icons.phone_android_rounded : Icons.payments_rounded,
                      color: isGcash ? AppColors.info : AppColors.success,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        isGcash
                            ? 'GCash Payment: Chat with the partner to send your payment receipt and confirm your booking.'
                            : 'Cash Payment: Pay the full amount to the partner on the pickup/delivery date.',
                        style: TextStyle(
                          color: isDark ? textSec : textPrim,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 3),

              // ── Actions ─────────────────────────────────────────────────
              // If GCash and we have a bookingId, offer Chat with Partner
              if (isGcash && bookingId != null && bookingId.isNotEmpty) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.chat_bubble_rounded, size: 18),
                    label: const Text('Chat with Partner',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    onPressed: () => context.go('/chat/$bookingId', extra: {
                      'receiverId': partnerUserId.isNotEmpty ? partnerUserId : null,
                      'name':       partnerName,
                      'carName':    carName,
                    }),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go(AppRoutes.bookings),
                  style: isGcash
                      ? ElevatedButton.styleFrom(
                          backgroundColor: AppColors.bgElevated,
                          foregroundColor: textPrim,
                        )
                      : null,
                  child: const Text('View My Bookings',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go(AppRoutes.home),
                  child: const Text('Back to Home',
                      style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
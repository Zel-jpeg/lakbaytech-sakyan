import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';

class ConfirmationScreen extends StatelessWidget {
  final String bookingCode;
  const ConfirmationScreen({super.key, required this.bookingCode});

  @override
  Widget build(BuildContext context) {
    final extra         = GoRouterState.of(context).extra as Map<String, dynamic>? ?? {};
    final bookingId     = extra['bookingId']     as String?;
    final paymentMethod = extra['paymentMethod'] as String? ?? 'cash';
    final partnerUserId = extra['partnerUserId'] as String? ?? '';
    final partnerName   = extra['partnerName']   as String? ?? 'Partner';
    final carName       = extra['carName']       as String? ?? '';

    final isGcash = paymentMethod == 'gcash';
    final theme   = Theme.of(context);
    final isDark  = theme.brightness == Brightness.dark;

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

              // ── Success icon ─────────────────────────────────────────────
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  color: AppColors.successBg,
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.success.withOpacity(0.3), width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.check_circle_rounded,
                      color: AppColors.success, size: 64),
                ),
              ),
              const SizedBox(height: 28),

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
                style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // ── Booking code card ────────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    Text('Booking Code',
                        style: TextStyle(color: textMuted, fontSize: 13)),
                    const SizedBox(height: 8),
                    Text(
                      bookingCode,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Save this code for reference',
                        style: TextStyle(color: textMuted, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ── Payment info banner ──────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: (isGcash ? AppColors.info : AppColors.success)
                      .withOpacity(isDark ? 0.14 : 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (isGcash ? AppColors.info : AppColors.success)
                        .withOpacity(0.35),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      isGcash
                          ? Icons.chat_bubble_rounded
                          : Icons.payments_rounded,
                      color: isGcash ? AppColors.info : AppColors.success,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isGcash
                                ? 'After approval, coordinate GCash via chat'
                                : 'Cash payment on pickup/delivery day',
                            style: TextStyle(
                              color: isGcash
                                  ? AppColors.info
                                  : AppColors.success,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isGcash
                                ? 'Once approved, message the partner. They will share their GCash number with you.'
                                : 'Pay the full amount (rental + booking fee) directly to the partner when they arrive or you pick up.',
                            style: TextStyle(
                              color: isDark ? textSec : textPrim,
                              fontSize: 12,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 3),

              // ── Chat with partner ────────────────────────────────────────
              if (bookingId != null && bookingId.isNotEmpty) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.chat_bubble_rounded, size: 18),
                    label: const Text('Chat with Partner',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    onPressed: () => context.push('/chat/$bookingId', extra: {
                      'receiverId':
                          partnerUserId.isNotEmpty ? partnerUserId : null,
                      'name':    partnerName,
                      'carName': carName,
                    }),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // ── View My Bookings ─────────────────────────────────────────
              // FIX: was using AppColors.bgElevated (very dark) as background
              // with textPrim as foreground — on dark mode both were dark so
              // the text was invisible. Now uses a bordered outline-style
              // button that always has visible contrast in both themes.
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: Icon(Icons.receipt_long_rounded,
                      size: 18, color: AppColors.primary),
                  label: const Text('View My Bookings',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                  onPressed: () => context.go(AppRoutes.bookings),
                ),
              ),
              const SizedBox(height: 12),

              // ── Back to Home ─────────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => context.go(AppRoutes.home),
                  child: Text('Back to Home',
                      style: TextStyle(
                          fontSize: 16, color: textMuted)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
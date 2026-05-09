import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../booking/models/booking_model.dart';
import '../providers/partner_provider.dart';

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(partnerBookingsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(title: const Text('Earnings')),
      body: bookingsAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
              const SizedBox(height: 12),
              Text('Failed to load earnings',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(partnerBookingsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (bookings) {
          final completed =
              bookings.where((b) => b.isCompleted).toList();
          final totalRevenue = completed.fold<double>(
              0, (s, b) => s + b.totalAmount);
          final totalCommission = completed.fold<double>(
              0, (s, b) => s + b.commissionAmount);
          final netEarnings = totalRevenue - totalCommission;
          final active =
              bookings.where((b) => b.isActive).length;
          final pending =
              bookings.where((b) => b.isPendingReview).length;

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(partnerBookingsProvider),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              children: [
                // ── Hero earnings card ─────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary,
                        AppColors.primaryDark,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.35),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.account_balance_wallet_rounded,
                              color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Text('Total Net Earnings',
                            style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ]),
                      const SizedBox(height: 16),
                      Text(
                        '₱${_fmt(netEarnings)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -1,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'from ${completed.length} completed booking${completed.length == 1 ? '' : 's'}',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── Summary cards row ──────────────────────────────────
                Row(children: [
                  Expanded(
                    child: _SummaryCard(
                      icon: Icons.payments_rounded,
                      iconColor: AppColors.success,
                      label: 'Gross Revenue',
                      value: '₱${_fmt(totalRevenue)}',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textMuted: textMuted,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _SummaryCard(
                      icon: Icons.percent_rounded,
                      iconColor: AppColors.warning,
                      label: 'Commission (10%)',
                      value: '₱${_fmt(totalCommission)}',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textMuted: textMuted,
                    ),
                  ),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: _SummaryCard(
                      icon: Icons.directions_car_rounded,
                      iconColor: AppColors.info,
                      label: 'Active Now',
                      value: '$active',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textMuted: textMuted,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _SummaryCard(
                      icon: Icons.pending_actions_rounded,
                      iconColor: AppColors.statusPending,
                      label: 'Pending Review',
                      value: '$pending',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textMuted: textMuted,
                    ),
                  ),
                ]),
                const SizedBox(height: 28),

                // ── Commission info banner ─────────────────────────────
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.infoBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: AppColors.info.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.info_rounded,
                        color: AppColors.info, size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Sakyan charges a 10% commission on each completed booking. '
                        'Net earnings = Gross – Commission.',
                        style: TextStyle(
                            color: AppColors.info,
                            fontSize: 12,
                            height: 1.5),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 28),

                // ── Completed bookings list ────────────────────────────
                Text('Completed Bookings',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: textPrim)),
                const SizedBox(height: 12),
                if (completed.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_long_rounded,
                              size: 56, color: textMuted),
                          const SizedBox(height: 12),
                          Text('No completed bookings yet',
                              style: TextStyle(
                                  color: textMuted, fontSize: 15)),
                        ],
                      ),
                    ),
                  )
                else
                  ...completed.map(
                    (b) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _EarningTile(
                        booking:     b,
                        cardColor:   cardColor,
                        borderColor: borderColor,
                        textPrim:    textPrim,
                        textSec:     textSec,
                        textMuted:   textMuted,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  static String _fmt(double v) =>
      v.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]},',
      );
}

// ── Summary card ──────────────────────────────────────────────────────────────
class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor, cardColor, borderColor, textPrim, textMuted;
  final String label, value;

  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        cardColor,
        borderRadius: BorderRadius.circular(16),
        border:       Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(height: 12),
          Text(value,
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: textPrim)),
          const SizedBox(height: 2),
          Text(label,
              style: TextStyle(fontSize: 11, color: textMuted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

// ── Earning tile ──────────────────────────────────────────────────────────────
class _EarningTile extends StatelessWidget {
  final BookingModel booking;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _EarningTile({
    required this.booking,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    final b   = booking;
    final net = b.totalAmount - b.commissionAmount;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        cardColor,
        borderRadius: BorderRadius.circular(14),
        border:       Border.all(color: borderColor),
      ),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.check_circle_rounded,
              color: AppColors.success, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(b.carName,
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: textPrim),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
              Text(
                b.customerName.isNotEmpty ? b.customerName : 'Customer',
                style: TextStyle(color: textSec, fontSize: 12),
              ),
              Text(
                '${b.startDate} → ${b.endDate}',
                style: TextStyle(color: textMuted, fontSize: 11),
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '₱${net.toStringAsFixed(0)}',
              style: const TextStyle(
                  color: AppColors.success,
                  fontWeight: FontWeight.w800,
                  fontSize: 14),
            ),
            Text(
              '-₱${b.commissionAmount.toStringAsFixed(0)} fee',
              style: TextStyle(color: textMuted, fontSize: 10),
            ),
          ],
        ),
      ]),
    );
  }
}
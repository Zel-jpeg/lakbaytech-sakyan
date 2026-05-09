import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../booking/models/booking_model.dart';
import '../models/partner_model.dart';
import '../providers/partner_provider.dart';

// ── Money formatter helper ────────────────────────────────────────────────────
String _fmtMoney(double v) {
  // e.g. 12500.0 → "12,500"  |  1234567 → "1,234,567"
  return v.toStringAsFixed(0).replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]},',
  );
}

class PartnerHomeScreen extends ConsumerWidget {
  const PartnerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user          = ref.watch(currentUserProvider);
    final statsAsync    = ref.watch(partnerStatsProvider);
    final bookingsAsync = ref.watch(partnerBookingsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;

    final firstName = user?.fullName.trim().split(' ').first ?? 'Partner';

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(partnerStatsProvider);
          ref.invalidate(partnerBookingsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── App bar ────────────────────────────────────────────────────
            SliverAppBar(
              floating: true,
              backgroundColor: scaffoldBg,
              title: Row(children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primaryGlow,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.dashboard_rounded,
                      color: AppColors.primary, size: 18),
                ),
                const SizedBox(width: 10),
                Text('Dashboard',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: textPrim)),
              ]),
              actions: [
                IconButton(
                  icon: Icon(Icons.notifications_outlined, color: textPrim),
                  onPressed: () => context.push(AppRoutes.notifications),
                ),
              ],
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Greeting ───────────────────────────────────────────
                    Text(
                      'Welcome back, $firstName 👋',
                      style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: textPrim),
                    ),
                    const SizedBox(height: 4),
                    Text("Here's your earnings overview.",
                        style: TextStyle(color: textSec, fontSize: 14)),
                    const SizedBox(height: 24),

                    // ── Stats grid ─────────────────────────────────────────
                    statsAsync.when(
                      loading: () => Column(
                        children: [
                          Row(children: [
                            Expanded(child: Shimmer.fromColors(
                              baseColor: shimBase, highlightColor: shimHigh,
                              child: Container(height: 96, decoration: BoxDecoration(color: shimBase, borderRadius: BorderRadius.circular(16))),
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: Shimmer.fromColors(
                              baseColor: shimBase, highlightColor: shimHigh,
                              child: Container(height: 96, decoration: BoxDecoration(color: shimBase, borderRadius: BorderRadius.circular(16))),
                            )),
                          ]),
                          const SizedBox(height: 12),
                          Row(children: [
                            Expanded(child: Shimmer.fromColors(
                              baseColor: shimBase, highlightColor: shimHigh,
                              child: Container(height: 96, decoration: BoxDecoration(color: shimBase, borderRadius: BorderRadius.circular(16))),
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: Shimmer.fromColors(
                              baseColor: shimBase, highlightColor: shimHigh,
                              child: Container(height: 96, decoration: BoxDecoration(color: shimBase, borderRadius: BorderRadius.circular(16))),
                            )),
                          ]),
                        ],
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                      data: (stats) => Column(
                        children: [
                          Row(children: [
                            Expanded(child: _StatCard(
                              icon: Icons.payments_rounded,
                              iconColor: AppColors.success,
                              label: 'Total Earnings',
                              // ── FIX: comma-formatted peso ─────────────────
                              value: '₱${_fmtMoney(stats.totalEarnings)}',
                              cardColor: cardColor, borderColor: borderColor,
                              textPrim: textPrim, textMuted: textMuted,
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: _StatCard(
                              icon: Icons.directions_car_rounded,
                              iconColor: AppColors.info,
                              label: 'Active Bookings',
                              value: '${stats.activeBookings}',
                              cardColor: cardColor, borderColor: borderColor,
                              textPrim: textPrim, textMuted: textMuted,
                            )),
                          ]),
                          const SizedBox(height: 12),
                          Row(children: [
                            Expanded(child: _StatCard(
                              icon: Icons.car_rental_rounded,
                              iconColor: AppColors.primary,
                              label: 'My Cars',
                              value: '${stats.totalCars}',
                              cardColor: cardColor, borderColor: borderColor,
                              textPrim: textPrim, textMuted: textMuted,
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: _StatCard(
                              icon: Icons.pending_actions_rounded,
                              iconColor: AppColors.warning,
                              label: 'Pending',
                              value: '${stats.pendingRequests}',
                              cardColor: cardColor, borderColor: borderColor,
                              textPrim: textPrim, textMuted: textMuted,
                            )),
                          ]),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // ── Quick actions ──────────────────────────────────────
                    Text('Quick Actions',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrim)),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: _QuickAction(
                        icon: Icons.add_circle_rounded,
                        label: 'Add Car',
                        color: AppColors.primary,
                        cardColor: cardColor, borderColor: borderColor,
                        textPrim: textPrim,
                        onTap: () => context.push(AppRoutes.addCar),
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: _QuickAction(
                        icon: Icons.receipt_long_rounded,
                        label: 'View Bookings',
                        color: AppColors.info,
                        cardColor: cardColor, borderColor: borderColor,
                        textPrim: textPrim,
                        onTap: () => context.go(AppRoutes.partnerBookings),
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: _QuickAction(
                        icon: Icons.bar_chart_rounded,
                        label: 'Earnings',
                        color: AppColors.success,
                        cardColor: cardColor, borderColor: borderColor,
                        textPrim: textPrim,
                        onTap: () => context.push(AppRoutes.earnings),
                      )),
                    ]),
                    const SizedBox(height: 28),

                    // ── Recent bookings header ─────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent Bookings',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: textPrim)),
                        TextButton(
                          onPressed: () =>
                              context.go(AppRoutes.partnerBookings),
                          child: const Text('See all',
                              style: TextStyle(
                                  color: AppColors.primary, fontSize: 13)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),

            // ── Recent bookings list ───────────────────────────────────────
            bookingsAsync.when(
              loading: () => SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                    child: Shimmer.fromColors(
                      baseColor:      shimBase,
                      highlightColor: shimHigh,
                      child: Container(
                        height: 90,
                        decoration: BoxDecoration(
                          color: shimBase,
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  childCount: 3,
                ),
              ),
              error: (_, __) =>
                  const SliverToBoxAdapter(child: SizedBox.shrink()),
              data: (bookings) {
                final recent = bookings.take(5).toList();
                if (recent.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.receipt_long_rounded,
                                size: 56, color: textMuted),
                            const SizedBox(height: 12),
                            Text('No bookings yet',
                                style: TextStyle(
                                    color: textMuted, fontSize: 15)),
                          ],
                        ),
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _RecentBookingTile(
                          booking:     recent[i],
                          cardColor:   cardColor,
                          borderColor: borderColor,
                          textPrim:    textPrim,
                          textSec:     textSec,
                          textMuted:   textMuted,
                          shimBase:    shimBase,
                        ),
                      ),
                      childCount: recent.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stat card ──────────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor, cardColor, borderColor, textPrim, textMuted;
  final String label, value;
  const _StatCard({
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 17),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.w800, color: textPrim),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
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

// ── Quick action ───────────────────────────────────────────────────────────────
class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color, cardColor, borderColor, textPrim;
  final VoidCallback onTap;
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: textPrim),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

// ── Recent booking tile ────────────────────────────────────────────────────────
class _RecentBookingTile extends StatelessWidget {
  final BookingModel booking;
  final Color cardColor, borderColor, textPrim, textSec, textMuted, shimBase;
  const _RecentBookingTile({
    required this.booking,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.shimBase,
  });

  Color _statusColor(String s) {
    switch (s) {
      case 'pending_review': return AppColors.warning;
      case 'approved':       return AppColors.success;
      case 'rejected':       return AppColors.error;
      case 'active':         return AppColors.info;
      case 'completed':      return AppColors.statusCompleted;
      case 'cancelled':      return AppColors.statusCancelled;
      default:               return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final b     = booking;
    final color = _statusColor(b.bookingStatus);

    return Container(
      decoration: BoxDecoration(
        color:        cardColor,
        borderRadius: BorderRadius.circular(14),
        border:       Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          // ── Car thumbnail ───────────────────────────────────────────────
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(14)),
            child: SizedBox(
              width: 76,
              height: 88,
              child: b.carImageUrl != null && b.carImageUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: b.carImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          Container(color: shimBase),
                      errorWidget: (_, __, ___) =>
                          _CarPlaceholder(bg: shimBase, iconColor: textMuted),
                    )
                  : _CarPlaceholder(bg: shimBase, iconColor: textMuted),
            ),
          ),

          // ── Info ─────────────────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Car name + status badge
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          b.carName.isNotEmpty ? b.carName : 'Car',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: textPrim,
                              fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(b.statusLabel,
                            style: TextStyle(
                                color: color,
                                fontSize: 9,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // ── Customer name with icon ──────────────────────────────
                  Row(children: [
                    Icon(Icons.person_outline_rounded,
                        size: 11, color: textMuted),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        b.customerName.isNotEmpty
                            ? b.customerName
                            : 'Customer',
                        style: TextStyle(
                            color: textSec,
                            fontSize: 12,
                            fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ]),
                  const SizedBox(height: 2),

                  // Dates
                  Row(children: [
                    Icon(Icons.date_range_rounded,
                        size: 11, color: textMuted),
                    const SizedBox(width: 3),
                    Text(
                      '${b.startDate} → ${b.endDate}',
                      style: TextStyle(color: textMuted, fontSize: 11),
                    ),
                  ]),
                  const SizedBox(height: 6),

                  // Amount — comma-formatted
                  Text(
                    '₱${_fmtMoney(b.totalAmount)}',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Car image placeholder ──────────────────────────────────────────────────────
class _CarPlaceholder extends StatelessWidget {
  final Color bg, iconColor;
  const _CarPlaceholder({required this.bg, required this.iconColor});

  @override
  Widget build(BuildContext context) => Container(
        color: bg,
        child: Center(
          child: Icon(Icons.directions_car_rounded,
              color: iconColor, size: 28),
        ),
      );
}
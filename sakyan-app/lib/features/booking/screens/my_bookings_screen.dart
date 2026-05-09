import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../models/booking_model.dart';
import '../providers/booking_provider.dart';

class MyBookingsScreen extends ConsumerWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(myBookingsProvider);
    final theme   = Theme.of(context);
    final isDark  = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Bookings'),
          bottom: TabBar(
            isScrollable:        true,
            tabAlignment:        TabAlignment.start,
            indicatorColor:      AppColors.primary,
            labelColor:          AppColors.primary,
            unselectedLabelColor: textMuted,
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Pending'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: bookingsAsync.when(
          loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.primary)),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
                const SizedBox(height: 12),
                Text('Failed to load bookings',
                    style: TextStyle(color: textMuted)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.invalidate(myBookingsProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (bookings) => TabBarView(
            children: [
              _BookingList(
                bookings: bookings, ref: ref,
                cardColor: cardColor, borderColor: borderColor,
                textPrim: textPrim, textSec: textSec, textMuted: textMuted,
              ),
              _BookingList(
                bookings: bookings
                    .where((b) => b.isPendingReview || b.isApproved)
                    .toList(),
                ref: ref,
                cardColor: cardColor, borderColor: borderColor,
                textPrim: textPrim, textSec: textSec, textMuted: textMuted,
              ),
              _BookingList(
                bookings: bookings.where((b) => b.isActive).toList(),
                ref: ref,
                cardColor: cardColor, borderColor: borderColor,
                textPrim: textPrim, textSec: textSec, textMuted: textMuted,
              ),
              _BookingList(
                bookings: bookings
                    .where((b) => b.isCompleted || b.isCancelled || b.isRejected)
                    .toList(),
                ref: ref,
                cardColor: cardColor, borderColor: borderColor,
                textPrim: textPrim, textSec: textSec, textMuted: textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Booking list ──────────────────────────────────────────────────────────────
class _BookingList extends StatelessWidget {
  final List<BookingModel> bookings;
  final WidgetRef ref;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _BookingList({
    required this.bookings,
    required this.ref,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_rounded, size: 64, color: textMuted),
            const SizedBox(height: 12),
            Text('No bookings here',
                style: TextStyle(color: textMuted, fontSize: 16)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async => ref.invalidate(myBookingsProvider),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: bookings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _BookingCard(
          booking: bookings[i],
          ref: ref,
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          textMuted: textMuted,
        ),
      ),
    );
  }
}

// ── Booking card ──────────────────────────────────────────────────────────────
class _BookingCard extends StatefulWidget {
  final BookingModel booking;
  final WidgetRef ref;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _BookingCard({
    required this.booking,
    required this.ref,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
  });

  @override
  State<_BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends State<_BookingCard> {
  bool _expanded = false;

  Color _statusColor(String status) {
    switch (status) {
      case 'pending_review': return AppColors.statusPending;
      case 'approved':       return AppColors.statusApproved;
      case 'rejected':       return AppColors.statusRejected;
      case 'active':         return AppColors.statusActive;
      case 'completed':      return AppColors.statusCompleted;
      case 'cancelled':      return AppColors.statusCancelled;
      default:               return AppColors.textMuted;
    }
  }

  Future<void> _cancel(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        await widget.ref
            .read(bookingRepositoryProvider)
            .cancelBooking(widget.booking.id);
        widget.ref.invalidate(myBookingsProvider);
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to cancel booking'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final b     = widget.booking;
    final color = _statusColor(b.bookingStatus);

    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: Container(
        decoration: BoxDecoration(
          color:        widget.cardColor,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: widget.borderColor),
        ),
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.carName,
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: widget.textPrim,
                                fontSize: 15)),
                        const SizedBox(height: 2),
                        Text('${b.startDate}  →  ${b.endDate}',
                            style: TextStyle(
                                color: widget.textMuted, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(b.bookingCode,
                            style: TextStyle(
                                color: widget.textSec,
                                fontSize: 12,
                                fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color:        color.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(b.statusLabel,
                            style: TextStyle(
                                color: color,
                                fontSize: 11,
                                fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 6),
                      Text('₱${b.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 15)),
                    ],
                  ),
                ],
              ),
            ),

            // ── Expanded detail ──────────────────────────────────────
            if (_expanded) ...[
              Divider(color: widget.borderColor, height: 1),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    _DetailRow('Total Days',
                        '${b.totalDays} day${b.totalDays == 1 ? '' : 's'}',
                        textPrim: widget.textPrim, textSec: widget.textSec),
                    _DetailRow('Price/Day',
                        '₱${b.pricePerDay.toStringAsFixed(0)}',
                        textPrim: widget.textPrim, textSec: widget.textSec),
                    _DetailRow('Payment Method', b.paymentMethod.toUpperCase(),
                        textPrim: widget.textPrim, textSec: widget.textSec),
                    _DetailRow('Payment Status', b.paymentStatus,
                        textPrim: widget.textPrim, textSec: widget.textSec),
                    _DetailRow('Fulfillment',
                        b.fulfillmentType == 'delivery'
                            ? 'Delivery'
                            : 'Self-Pickup',
                        textPrim: widget.textPrim, textSec: widget.textSec),
                    if (b.deliveryAddress.isNotEmpty)
                      _DetailRow('Delivery Address', b.deliveryAddress,
                          textPrim: widget.textPrim, textSec: widget.textSec),
                    if (b.specialRequests.isNotEmpty)
                      _DetailRow('Special Requests', b.specialRequests,
                          textPrim: widget.textPrim, textSec: widget.textSec),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.chat_bubble_rounded,
                                size: 16),
                            label: const Text('Message Partner'),
                            onPressed: () =>
                                context.push('/chat/${b.id}'),
                          ),
                        ),
                        if (b.canCancel) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => _cancel(context),
                              style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.error),
                              child: const Text('Cancel'),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Detail row ────────────────────────────────────────────────────────────────
class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color textPrim, textSec;
  const _DetailRow(this.label, this.value,
      {required this.textPrim, required this.textSec});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: textSec, fontSize: 13)),
          Text(value,
              style: TextStyle(
                  color: textPrim,
                  fontSize: 13,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
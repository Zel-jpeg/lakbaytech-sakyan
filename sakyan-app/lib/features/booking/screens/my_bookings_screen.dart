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

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: AppColors.bgBase,
        appBar: AppBar(
          title: const Text('My Bookings'),
          bottom: const TabBar(
            isScrollable:        true,
            tabAlignment:        TabAlignment.start,
            indicatorColor:      AppColors.primary,
            labelColor:          AppColors.primary,
            unselectedLabelColor: AppColors.textMuted,
            tabs: [
              Tab(text: 'All'),
              Tab(text: 'Pending'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: bookingsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.textMuted),
                const SizedBox(height: 12),
                const Text('Failed to load bookings', style: TextStyle(color: AppColors.textMuted)),
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
              _BookingList(bookings: bookings, ref: ref),
              _BookingList(bookings: bookings.where((b) => b.isPendingReview || b.isApproved).toList(), ref: ref),
              _BookingList(bookings: bookings.where((b) => b.isActive).toList(), ref: ref),
              _BookingList(bookings: bookings.where((b) => b.isCompleted || b.isCancelled || b.isRejected).toList(), ref: ref),
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
  const _BookingList({required this.bookings, required this.ref});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_rounded, size: 64, color: AppColors.textMuted),
            SizedBox(height: 12),
            Text('No bookings here', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
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
        itemBuilder: (_, i) => _BookingCard(booking: bookings[i], ref: ref),
      ),
    );
  }
}

// ── Booking card ──────────────────────────────────────────────────────────────
class _BookingCard extends StatefulWidget {
  final BookingModel booking;
  final WidgetRef    ref;
  const _BookingCard({required this.booking, required this.ref});

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
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
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
        await widget.ref.read(bookingRepositoryProvider).cancelBooking(widget.booking.id);
        widget.ref.invalidate(myBookingsProvider);
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to cancel booking'), backgroundColor: AppColors.error),
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
          color:        AppColors.bgSurface,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.carName, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontSize: 15)),
                        const SizedBox(height: 2),
                        Text('${b.startDate}  →  ${b.endDate}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(b.bookingCode, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontFamily: 'monospace')),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color:        color.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(b.statusLabel, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 6),
                      Text('₱${b.totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 15)),
                    ],
                  ),
                ],
              ),
            ),

            // ── Expanded detail ─────────────────────────────────
            if (_expanded) ...[
              const Divider(color: AppColors.border, height: 1),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    _DetailRow('Total Days',     '${b.totalDays} day${b.totalDays == 1 ? '' : 's'}'),
                    _DetailRow('Price/Day',      '₱${b.pricePerDay.toStringAsFixed(0)}'),
                    _DetailRow('Payment Method', b.paymentMethod.toUpperCase()),
                    _DetailRow('Payment Status', b.paymentStatus),
                    _DetailRow('Fulfillment',    b.fulfillmentType == 'delivery' ? 'Delivery' : 'Self-Pickup'),
                    if (b.deliveryAddress.isNotEmpty)
                      _DetailRow('Delivery Address', b.deliveryAddress),
                    if (b.specialRequests.isNotEmpty)
                      _DetailRow('Special Requests', b.specialRequests),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon:     const Icon(Icons.chat_bubble_rounded, size: 16),
                            label:    const Text('Message Partner'),
                            onPressed: () => context.push('/chat/${b.id}'),
                          ),
                        ),
                        if (b.canCancel) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => _cancel(context),
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
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
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../booking/models/booking_model.dart';
import '../providers/partner_provider.dart';

class PartnerBookingsScreen extends ConsumerStatefulWidget {
  const PartnerBookingsScreen({super.key});

  @override
  ConsumerState<PartnerBookingsScreen> createState() =>
      _PartnerBookingsScreenState();
}

class _PartnerBookingsScreenState
    extends ConsumerState<PartnerBookingsScreen> {
  int _tabIndex = 0;

  static const _tabs = [
    'All',
    'Pending',
    'Active',
    'Completed',
  ];

  List<BookingModel> _filter(List<BookingModel> all) {
    switch (_tabIndex) {
      case 1:
        return all.where((b) => b.isPendingReview).toList();
      case 2:
        return all.where((b) => b.isApproved || b.isActive).toList();
      case 3:
        return all
            .where((b) => b.isCompleted || b.isCancelled || b.isRejected)
            .toList();
      default:
        return all;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(partnerBookingsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: _TabBar(
            tabs:         _tabs,
            selectedIndex: _tabIndex,
            onTap:        (i) => setState(() => _tabIndex = i),
            borderColor:  borderColor,
            textMuted:    textMuted,
          ),
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
                onPressed: () => ref.invalidate(partnerBookingsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (bookings) {
          final filtered = _filter(bookings);
          if (filtered.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long_rounded,
                      size: 64, color: textMuted),
                  const SizedBox(height: 12),
                  Text('No bookings here',
                      style: TextStyle(color: textMuted, fontSize: 16)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(partnerBookingsProvider),
            child: ListView.separated(
              padding:
                  const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _BookingCard(
                booking:     filtered[i],
                cardColor:   cardColor,
                borderColor: borderColor,
                textPrim:    textPrim,
                textSec:     textSec,
                textMuted:   textMuted,
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Custom tab bar ────────────────────────────────────────────────────────────
class _TabBar extends StatelessWidget {
  final List<String> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final Color borderColor, textMuted;

  const _TabBar({
    required this.tabs,
    required this.selectedIndex,
    required this.onTap,
    required this.borderColor,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration:
          BoxDecoration(border: Border(bottom: BorderSide(color: borderColor))),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: tabs.length,
        itemBuilder: (_, i) {
          final sel = i == selectedIndex;
          return GestureDetector(
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: sel ? AppColors.primary : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Center(
                child: Text(
                  tabs[i],
                  style: TextStyle(
                    fontSize:   13,
                    fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                    color:      sel ? AppColors.primary : textMuted,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Booking card ──────────────────────────────────────────────────────────────
class _BookingCard extends ConsumerStatefulWidget {
  final BookingModel booking;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _BookingCard({
    required this.booking,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
  });

  @override
  ConsumerState<_BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends ConsumerState<_BookingCard> {
  bool _expanded = false;

  Color _statusColor(String s) {
    switch (s) {
      case 'pending_review': return AppColors.statusPending;
      case 'approved':       return AppColors.statusApproved;
      case 'rejected':       return AppColors.statusRejected;
      case 'active':         return AppColors.statusActive;
      case 'completed':      return AppColors.statusCompleted;
      case 'cancelled':      return AppColors.statusCancelled;
      default:               return AppColors.textMuted;
    }
  }

  Future<void> _confirm({
    required String title,
    required String body,
    required VoidCallback onConfirm,
    Color? confirmColor,
  }) async {
    final ok = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(true),
            style: ElevatedButton.styleFrom(
                backgroundColor: confirmColor ?? AppColors.primary),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (ok == true) onConfirm();
  }

  Future<void> _rejectWithReason() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Booking'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Provide a reason for rejection (optional):'),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              maxLines: 3,
              decoration: const InputDecoration(
                  hintText: 'e.g. Car unavailable on those dates'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await ref
          .read(bookingActionProvider.notifier)
          .reject(widget.booking.id, reason: ctrl.text.trim());
    }
  }

  Future<void> _updatePaymentStatus() async {
    String selected = widget.booking.paymentStatus;
    final ok = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('Update Payment Status'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: ['pending', 'partial', 'paid', 'refunded'].map((s) {
              return RadioListTile<String>(
                title: Text(
                    s[0].toUpperCase() + s.substring(1),
                    style: const TextStyle(fontSize: 14)),
                value: s,
                groupValue: selected,
                activeColor: AppColors.primary,
                onChanged: (v) => setSt(() => selected = v!),
                contentPadding: EdgeInsets.zero,
                dense: true,
              );
            }).toList(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(true),
              child: const Text('Update'),
            ),
          ],
        ),
      ),
    );
    if (ok == true && mounted) {
      await ref
          .read(bookingActionProvider.notifier)
          .updatePayment(widget.booking.id, selected);
    }
  }

  Future<void> _logRentalTimes() async {
    DateTime? startDt  = widget.booking.actualStartTime  != null
        ? DateTime.tryParse(widget.booking.actualStartTime!)
        : null;
    DateTime? returnDt = widget.booking.actualReturnTime != null
        ? DateTime.tryParse(widget.booking.actualReturnTime!)
        : null;

    Future<DateTime?> _pick(DateTime? initial) async {
      final date = await showDatePicker(
        context: context,
        initialDate: initial ?? DateTime.now(),
        firstDate: DateTime(2020),
        lastDate: DateTime.now().add(const Duration(days: 365)),
      );
      if (date == null) return null;
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(initial ?? DateTime.now()),
      );
      if (time == null) return null;
      return DateTime(date.year, date.month, date.day, time.hour, time.minute);
    }

    final ok = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('Log Rental Times'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _TimeRow(
                label: 'Actual Start',
                value: startDt,
                onPick: () async {
                  final d = await _pick(startDt);
                  if (d != null) setSt(() => startDt = d);
                },
              ),
              const SizedBox(height: 12),
              _TimeRow(
                label: 'Actual Return',
                value: returnDt,
                onPick: () async {
                  final d = await _pick(returnDt);
                  if (d != null) setSt(() => returnDt = d);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (ok == true && mounted) {
      await ref.read(partnerRepositoryProvider).updateRentalTimes(
            widget.booking.id,
            startDt?.toIso8601String(),
            returnDt?.toIso8601String(),
          );
      ref.invalidate(partnerBookingsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b      = widget.booking;
    final color  = _statusColor(b.bookingStatus);
    final action = ref.watch(bookingActionProvider);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color:        widget.cardColor,
        borderRadius: BorderRadius.circular(16),
        border:       Border.all(color: widget.borderColor),
      ),
      child: Column(
        children: [
          // ── Header row ─────────────────────────────────────────────
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Status dot
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.directions_car_rounded,
                        color: color, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.carName,
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: widget.textPrim),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text(
                          b.customerName.isNotEmpty
                              ? b.customerName
                              : 'Customer',
                          style: TextStyle(
                              color: widget.textSec, fontSize: 12),
                        ),
                        Text(
                          '${b.startDate}  →  ${b.endDate}',
                          style: TextStyle(
                              color: widget.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(b.statusLabel,
                            style: TextStyle(
                                color: color,
                                fontSize: 10,
                                fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₱${b.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 14),
                      ),
                      Icon(
                        _expanded
                            ? Icons.expand_less_rounded
                            : Icons.expand_more_rounded,
                        color: widget.textMuted,
                        size: 18,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ── Expanded detail ──────────────────────────────────────────
          if (_expanded) ...[
            Divider(color: widget.borderColor, height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Booking info rows
                  _InfoRow('Booking Code', b.bookingCode,
                      textPrim: widget.textPrim, textSec: widget.textSec),
                  _InfoRow('Days', '${b.totalDays} day${b.totalDays == 1 ? '' : 's'}',
                      textPrim: widget.textPrim, textSec: widget.textSec),
                  _InfoRow('Price/Day',
                      '₱${b.pricePerDay.toStringAsFixed(0)}',
                      textPrim: widget.textPrim, textSec: widget.textSec),
                  _InfoRow('Payment Method',
                      b.paymentMethod.toUpperCase(),
                      textPrim: widget.textPrim, textSec: widget.textSec),
                  _InfoRow(
                    'Payment Status',
                    b.paymentStatus[0].toUpperCase() +
                        b.paymentStatus.substring(1),
                    textPrim: widget.textPrim,
                    textSec: widget.textSec,
                    valueColor: _paymentColor(b.paymentStatus),
                  ),
                  _InfoRow('Fulfillment',
                      b.fulfillmentType == 'delivery'
                          ? 'Delivery'
                          : 'Self-Pickup',
                      textPrim: widget.textPrim, textSec: widget.textSec),
                  if (b.deliveryAddress.isNotEmpty)
                    _InfoRow('Delivery Address', b.deliveryAddress,
                        textPrim: widget.textPrim, textSec: widget.textSec),
                  if (b.gcashReference.isNotEmpty)
                    _InfoRow('GCash Ref', b.gcashReference,
                        textPrim: widget.textPrim, textSec: widget.textSec),
                  if (b.specialRequests.isNotEmpty)
                    _InfoRow('Special Requests', b.specialRequests,
                        textPrim: widget.textPrim, textSec: widget.textSec),
                  if (b.actualStartTime != null)
                    _InfoRow('Actual Start', _fmtDt(b.actualStartTime!),
                        textPrim: widget.textPrim, textSec: widget.textSec),
                  if (b.actualReturnTime != null)
                    _InfoRow('Actual Return', _fmtDt(b.actualReturnTime!),
                        textPrim: widget.textPrim, textSec: widget.textSec),
                  const SizedBox(height: 14),

                  // ── Action buttons ─────────────────────────────────
                  if (b.isPendingReview) ...[
                    Row(children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.check_rounded, size: 16),
                          label: const Text('Approve'),
                          onPressed: action.isLoading
                              ? null
                              : () => _confirm(
                                    title: 'Approve Booking',
                                    body:
                                        'Approve this booking for ${b.customerName}?',
                                    onConfirm: () => ref
                                        .read(bookingActionProvider.notifier)
                                        .approve(b.id),
                                    confirmColor: AppColors.success,
                                  ),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.success),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.close_rounded, size: 16),
                          label: const Text('Reject'),
                          onPressed: action.isLoading
                              ? null
                              : _rejectWithReason,
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.error),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                  ],

                  if (b.isApproved || b.isActive) ...[
                    Row(children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.payments_rounded, size: 14),
                          label: const Text('Payment'),
                          onPressed: _updatePaymentStatus,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.access_time_rounded,
                              size: 14),
                          label: const Text('Log Times'),
                          onPressed: _logRentalTimes,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                  ],

                  if (b.isApproved) ...[
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.flag_rounded, size: 16),
                        label: const Text('Mark Completed'),
                        onPressed: action.isLoading
                            ? null
                            : () => _confirm(
                                  title: 'Complete Booking',
                                  body:
                                      'Mark this rental as completed?',
                                  onConfirm: () => ref
                                      .read(bookingActionProvider.notifier)
                                      .complete(b.id),
                                  confirmColor: AppColors.statusCompleted,
                                ),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.statusCompleted),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Message customer button (always visible when expanded)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.chat_bubble_rounded, size: 14),
                      label: const Text('Message Customer'),
                      onPressed: () => context.push(
                        '/chat/${b.id}',
                        extra: {
                          'receiverId': b.customerId,
                          'name':       b.customerName,
                          'carName':    b.carName,
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _paymentColor(String status) {
    switch (status) {
      case 'paid':     return AppColors.success;
      case 'partial':  return AppColors.warning;
      case 'refunded': return AppColors.info;
      default:         return AppColors.statusPending;
    }
  }

  String _fmtDt(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return '${dt.day}/${dt.month}/${dt.year} '
        '${dt.hour.toString().padLeft(2, '0')}:'
        '${dt.minute.toString().padLeft(2, '0')}';
  }
}

// ── Info row ──────────────────────────────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final String label, value;
  final Color? valueColor;
  final Color textPrim, textSec;

  const _InfoRow(this.label, this.value, {
    this.valueColor,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(color: textSec, fontSize: 12)),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                  color: valueColor ?? textPrim,
                  fontSize: 12,
                  fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Time row ──────────────────────────────────────────────────────────────────
class _TimeRow extends StatelessWidget {
  final String label;
  final DateTime? value;
  final VoidCallback onPick;

  const _TimeRow({
    required this.label,
    required this.value,
    required this.onPick,
  });

  String _fmt(DateTime dt) =>
      '${dt.day}/${dt.month}/${dt.year}  '
      '${dt.hour.toString().padLeft(2, '0')}:'
      '${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPick,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.primaryGlow,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        ),
        child: Row(children: [
          const Icon(Icons.calendar_today_rounded,
              color: AppColors.primary, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600)),
                Text(
                  value != null ? _fmt(value!) : 'Tap to set',
                  style: const TextStyle(
                      color: AppColors.primary, fontSize: 13),
                ),
              ],
            ),
          ),
          const Icon(Icons.edit_rounded,
              color: AppColors.primary, size: 14),
        ]),
      ),
    );
  }
}
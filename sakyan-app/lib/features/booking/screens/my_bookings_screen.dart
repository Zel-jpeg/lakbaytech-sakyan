import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../models/booking_model.dart';
import '../providers/booking_provider.dart';

// ── Capitalise helper ─────────────────────────────────────────────────────────
String _cap(String? s) {
  if (s == null || s.trim().isEmpty) return '';
  return s.trim().split(' ').map((w) {
    if (w.isEmpty) return w;
    return w[0].toUpperCase() + w.substring(1);
  }).join(' ');
}

// ── Booking fee constant (must match checkout_screen.dart) ────────────────────
const double _kBookingFee = 100.0;

// ── Status filter enum ────────────────────────────────────────────────────────
enum _BookingFilter { all, pending, active, completed }

extension _BookingFilterX on _BookingFilter {
  String get label {
    switch (this) {
      case _BookingFilter.all:       return 'All';
      case _BookingFilter.pending:   return 'Pending';
      case _BookingFilter.active:    return 'Active';
      case _BookingFilter.completed: return 'Done';
    }
  }

  IconData get icon {
    switch (this) {
      case _BookingFilter.all:       return Icons.receipt_long_rounded;
      case _BookingFilter.pending:   return Icons.pending_rounded;
      case _BookingFilter.active:    return Icons.directions_car_rounded;
      case _BookingFilter.completed: return Icons.check_circle_rounded;
    }
  }

  Color get color {
    switch (this) {
      case _BookingFilter.all:       return AppColors.primary;
      case _BookingFilter.pending:   return AppColors.statusPending;
      case _BookingFilter.active:    return AppColors.statusActive;
      case _BookingFilter.completed: return AppColors.statusCompleted;
    }
  }

  List<BookingModel> filter(List<BookingModel> list) {
    switch (this) {
      case _BookingFilter.all:
        return list;
      case _BookingFilter.pending:
        return list.where((b) => b.isPendingReview || b.isApproved).toList();
      case _BookingFilter.active:
        return list.where((b) => b.isActive).toList();
      case _BookingFilter.completed:
        return list
            .where((b) => b.isCompleted || b.isCancelled || b.isRejected)
            .toList();
    }
  }
}

// ── Main Screen ───────────────────────────────────────────────────────────────
class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen>
    with WidgetsBindingObserver {
  _BookingFilter _filter = _BookingFilter.all;
  Timer? _pollTimer;

  final Map<String, String> _prevStatuses = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refresh();
    }
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      if (mounted) _silentRefresh();
    });
  }

  Future<void> _refresh() async {
    ref.invalidate(myBookingsProvider);
  }

  Future<void> _silentRefresh() async {
    try {
      final fresh = await ref.read(bookingRepositoryProvider).getMyBookings();
      final current = ref.read(myBookingsProvider).value ?? [];

      final currentMap = {for (final b in current) b.id: b.bookingStatus};

      for (final b in fresh) {
        final prev = _prevStatuses[b.id] ?? currentMap[b.id];
        if (prev != null && prev != b.bookingStatus && mounted) {
          _showStatusToast(b);
        }
        _prevStatuses[b.id] = b.bookingStatus;
      }

      ref.invalidate(myBookingsProvider);
    } catch (_) {}
  }

  void _showStatusToast(BookingModel b) {
    final (icon, color, msg) = _toastForStatus(b.bookingStatus, b.carName);
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        backgroundColor: color,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        duration: const Duration(seconds: 4),
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Booking Update',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13),
                  ),
                  Text(
                    msg,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (IconData, Color, String) _toastForStatus(String status, String carName) {
    switch (status) {
      case 'approved':
        return (Icons.check_circle_rounded, AppColors.success,
            '$carName booking was approved! 🎉');
      case 'rejected':
        return (Icons.cancel_rounded, AppColors.error,
            '$carName booking was rejected.');
      case 'active':
        return (Icons.directions_car_rounded, AppColors.statusActive,
            '$carName rental is now active. Safe travels!');
      case 'completed':
        return (Icons.flag_rounded, AppColors.statusCompleted,
            '$carName rental completed. Thanks for riding!');
      case 'cancelled':
        return (Icons.block_rounded, AppColors.statusCancelled,
            '$carName booking was cancelled.');
      default:
        return (Icons.info_rounded, AppColors.info, 'Booking status updated.');
    }
  }

  // ── Open booking detail modal ─────────────────────────────────────────────
  void _openDetailModal(BuildContext context, BookingModel booking) {
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookingDetailModal(
        booking: booking,
        isDark: isDark,
        onCancel: _refresh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(myBookingsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    bookingsAsync.whenData((bookings) {
      for (final b in bookings) {
        _prevStatuses.putIfAbsent(b.id, () => b.bookingStatus);
      }
    });

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        backgroundColor: scaffoldBg,
        title: const Text('My Bookings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          _FilterBar(
            selected: _filter,
            onChanged: (f) => setState(() => _filter = f),
            isDark: isDark,
            bookings: bookingsAsync.value ?? [],
          ),
          Expanded(
            child: bookingsAsync.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
              error: (e, _) => _ErrorView(
                onRetry: _refresh,
                textMuted: textMuted,
              ),
              data: (bookings) {
                final filtered = _filter.filter(bookings);
                if (filtered.isEmpty) {
                  return _EmptyView(
                    filter: _filter,
                    textMuted: textMuted,
                    onShowAll: () => setState(() => _filter = _BookingFilter.all),
                  );
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _refresh,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _BookingCard(
                      booking: filtered[i],
                      isDark: isDark,
                      onTap: () => _openDetailModal(context, filtered[i]),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Filter bar ────────────────────────────────────────────────────────────────
class _FilterBar extends StatelessWidget {
  final _BookingFilter selected;
  final ValueChanged<_BookingFilter> onChanged;
  final bool isDark;
  final List<BookingModel> bookings;

  const _FilterBar({
    required this.selected,
    required this.onChanged,
    required this.isDark,
    required this.bookings,
  });

  int _count(_BookingFilter f) => f.filter(bookings).length;

  @override
  Widget build(BuildContext context) {
    final bg     = isDark ? AppColors.bgBase     : const Color(0xFFF9FAFB);
    final border = isDark ? AppColors.border     : AppColors.borderLight;

    return Container(
      decoration: BoxDecoration(
        color:  bg,
        border: Border(bottom: BorderSide(color: border)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: _BookingFilter.values.map((f) {
            final isSelected = f == selected;
            final count = bookings.isEmpty ? null : _count(f);
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _FilterChip(
                filter: f,
                isSelected: isSelected,
                count: count,
                isDark: isDark,
                onTap: () => onChanged(f),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final _BookingFilter filter;
  final bool isSelected;
  final int? count;
  final bool isDark;
  final VoidCallback onTap;

  const _FilterChip({
    required this.filter,
    required this.isSelected,
    required this.count,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color     = filter.color;
    final textMuted = isDark ? AppColors.textMuted : AppColors.textMutedLight;
    final surfaceBg = isDark ? AppColors.bgSurface : AppColors.bgSurfaceLight;
    final borderCol = isDark ? AppColors.border    : AppColors.borderLight;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color:        isSelected ? color.withOpacity(0.12) : surfaceBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? color : borderCol,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(filter.icon, size: 14,
                color: isSelected ? color : textMuted),
            const SizedBox(width: 6),
            Text(
              filter.label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color:      isSelected ? color : textMuted,
              ),
            ),
            if (count != null && count! > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? color.withOpacity(0.2)
                      : (isDark ? AppColors.bgElevated : AppColors.bgElevatedLight),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? color : textMuted,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────
class _EmptyView extends StatelessWidget {
  final _BookingFilter filter;
  final Color textMuted;
  final VoidCallback onShowAll;

  const _EmptyView({
    required this.filter,
    required this.textMuted,
    required this.onShowAll,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(filter.icon, size: 64, color: textMuted.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            filter == _BookingFilter.all
                ? 'No bookings yet'
                : 'No ${filter.label.toLowerCase()} bookings',
            style: TextStyle(
                color: textMuted, fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            filter == _BookingFilter.all
                ? 'Book a car to get started!'
                : 'Try a different filter',
            style: TextStyle(color: textMuted, fontSize: 13),
          ),
          if (filter != _BookingFilter.all) ...[
            const SizedBox(height: 16),
            TextButton(
              onPressed: onShowAll,
              child: const Text('Show all bookings'),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Error view ────────────────────────────────────────────────────────────────
class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  final Color textMuted;
  const _ErrorView({required this.onRetry, required this.textMuted});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.wifi_off_rounded, size: 52, color: textMuted),
          const SizedBox(height: 12),
          Text('Failed to load bookings',
              style: TextStyle(
                  color: textMuted, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Retry'),
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

// ── Booking card (tap → modal) ────────────────────────────────────────────────
class _BookingCard extends StatelessWidget {
  final BookingModel booking;
  final bool isDark;
  final VoidCallback onTap;

  const _BookingCard({
    required this.booking,
    required this.isDark,
    required this.onTap,
  });

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

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending_review': return Icons.pending_rounded;
      case 'approved':       return Icons.check_circle_outline_rounded;
      case 'rejected':       return Icons.cancel_outlined;
      case 'active':         return Icons.directions_car_rounded;
      case 'completed':      return Icons.flag_rounded;
      case 'cancelled':      return Icons.block_rounded;
      default:               return Icons.info_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final b           = booking;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final statusColor = _statusColor(b.bookingStatus);
    final statusIcon  = _statusIcon(b.bookingStatus);

    // Subtotal is the car cost; total includes booking fee
    final subtotal    = b.subtotal > 0 ? b.subtotal : b.pricePerDay * b.totalDays;
    final total       = b.totalAmount > 0 ? b.totalAmount : subtotal + _kBookingFee;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            // ── Header row ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Status icon
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Icon(statusIcon, color: statusColor, size: 20),
                  ),
                  const SizedBox(width: 12),

                  // Car + dates
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          b.carName.isEmpty ? 'Car Booking' : _cap(b.carName),
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: textPrim,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(children: [
                          Icon(Icons.calendar_today_rounded,
                              size: 11, color: textMuted),
                          const SizedBox(width: 4),
                          Text(
                            '${b.startDate}  →  ${b.endDate}',
                            style: TextStyle(color: textMuted, fontSize: 11),
                          ),
                        ]),
                        const SizedBox(height: 2),
                        Text(
                          b.bookingCode,
                          style: TextStyle(
                            color: textSec,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Price + status badge + chevron
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₱${total.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Small "incl. fee" hint so user knows what the total is
                      Text(
                        'incl. ₱${_kBookingFee.toStringAsFixed(0)} fee',
                        style: TextStyle(color: textMuted, fontSize: 10),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          b.statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Tap-for-details hint
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Details',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                          const Icon(Icons.chevron_right_rounded,
                              size: 14, color: AppColors.primary),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Progress bar for active/pending bookings ────────────────────
            if (b.isActive || b.isPendingReview || b.isApproved)
              _StatusProgressBar(
                booking: b,
                statusColor: statusColor,
                borderColor: borderColor,
                isDark: isDark,
              ),
          ],
        ),
      ),
    );
  }
}

// ── Status progress bar ───────────────────────────────────────────────────────
class _StatusProgressBar extends StatelessWidget {
  final BookingModel booking;
  final Color statusColor;
  final Color borderColor;
  final bool isDark;

  const _StatusProgressBar({
    required this.booking,
    required this.statusColor,
    required this.borderColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final steps = ['Submitted', 'Approved', 'Active', 'Completed'];
    int currentStep;
    if (booking.isPendingReview) currentStep = 0;
    else if (booking.isApproved) currentStep = 1;
    else if (booking.isActive)   currentStep = 2;
    else                         currentStep = 3;

    if (booking.isCancelled || booking.isRejected) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
      child: Column(
        children: [
          Divider(color: borderColor, height: 1),
          const SizedBox(height: 10),
          Row(
            children: List.generate(steps.length * 2 - 1, (i) {
              if (i.isOdd) {
                final stepIdx = i ~/ 2;
                final filled  = stepIdx < currentStep;
                return Expanded(
                  child: Container(
                    height: 2,
                    color: filled
                        ? statusColor
                        : (isDark ? AppColors.bgElevated : AppColors.bgElevatedLight),
                  ),
                );
              }
              final stepIdx = i ~/ 2;
              final done    = stepIdx <= currentStep;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 20, height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: done
                      ? statusColor
                      : (isDark ? AppColors.bgElevated : AppColors.bgElevatedLight),
                  border: Border.all(
                    color: done
                        ? statusColor
                        : (isDark ? AppColors.border : AppColors.borderLight),
                    width: 1.5,
                  ),
                ),
                child: done
                    ? const Icon(Icons.check_rounded,
                        size: 11, color: Colors.white)
                    : null,
              );
            }),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: steps.map((s) {
              final idx  = steps.indexOf(s);
              final done = idx <= currentStep;
              return SizedBox(
                width: 54,
                child: Text(
                  s,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: done ? FontWeight.w600 : FontWeight.w400,
                    color: done
                        ? statusColor
                        : (isDark ? AppColors.textMuted : AppColors.textMutedLight),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
class _BookingDetailModal extends ConsumerStatefulWidget {
  final BookingModel booking;
  final bool isDark;
  final VoidCallback onCancel;

  const _BookingDetailModal({
    required this.booking,
    required this.isDark,
    required this.onCancel,
  });

  @override
  ConsumerState<_BookingDetailModal> createState() =>
      _BookingDetailModalState();
}

class _BookingDetailModalState extends ConsumerState<_BookingDetailModal> {
  bool _cancelling = false;

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

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending_review': return Icons.pending_rounded;
      case 'approved':       return Icons.check_circle_rounded;
      case 'rejected':       return Icons.cancel_rounded;
      case 'active':         return Icons.directions_car_rounded;
      case 'completed':      return Icons.flag_rounded;
      case 'cancelled':      return Icons.block_rounded;
      default:               return Icons.info_rounded;
    }
  }

  Future<void> _handleCancel(BuildContext ctx) async {
    final confirmed = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Keep it')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true || !ctx.mounted) return;

    setState(() => _cancelling = true);
    try {
      await ref
          .read(bookingRepositoryProvider)
          .cancelBooking(widget.booking.id);
      widget.onCancel();
      if (ctx.mounted) {
        Navigator.of(ctx).pop(); // close modal
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(
            content: const Row(children: [
              Icon(Icons.check_rounded, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Booking cancelled'),
            ]),
            backgroundColor: AppColors.statusCancelled,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          ),
        );
      }
    } catch (_) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(
            content: Text('Failed to cancel booking'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b           = widget.booking;
    final isDark      = widget.isDark;
    final modalBg     = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final sectionBg   = isDark ? AppColors.bgBase        : const Color(0xFFF9FAFB);

    final statusColor = _statusColor(b.bookingStatus);
    final statusIcon  = _statusIcon(b.bookingStatus);

    // Price breakdown
    final subtotal   = b.subtotal > 0 ? b.subtotal : b.pricePerDay * b.totalDays;
    final bookingFee = _kBookingFee;
    final total      = b.totalAmount > 0 ? b.totalAmount : subtotal + bookingFee;

    // Partner name
    final partnerDisplay = b.partnerName.isNotEmpty
        ? _cap(b.partnerName)
        : 'Partner';

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize:     0.5,
      maxChildSize:     0.97,
      builder: (_, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color:        modalBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // ── Drag handle ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // ── Scrollable content ─────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                controller: scrollCtrl,
                padding: EdgeInsets.fromLTRB(
                    20, 8, 20,
                    MediaQuery.of(context).padding.bottom + 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Status hero ──────────────────────────────────────────
                    Row(
                      children: [
                        Container(
                          width: 52, height: 52,
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: statusColor.withOpacity(0.35), width: 1.5),
                          ),
                          child: Icon(statusIcon, color: statusColor, size: 26),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                b.carName.isEmpty ? 'Car Booking' : _cap(b.carName),
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: textPrim),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  b.statusLabel,
                                  style: TextStyle(
                                      color: statusColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Booking code
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      margin: const EdgeInsets.only(top: 10),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.primary.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.tag_rounded,
                              size: 14, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Booking Code:  ',
                            style: TextStyle(
                                color: textMuted,
                                fontSize: 12,
                                fontWeight: FontWeight.w500),
                          ),
                          Text(
                            b.bookingCode,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── SECTION: Rental Dates ─────────────────────────────────
                    _SectionHeader(label: 'Rental Dates', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: sectionBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        children: [
                          _InfoRow(
                            icon: Icons.calendar_today_rounded,
                            label: 'Pick-up Date',
                            value: b.startDate,
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                          Divider(height: 1, color: borderColor),
                          _InfoRow(
                            icon: Icons.event_rounded,
                            label: 'Return Date',
                            value: b.endDate,
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                          Divider(height: 1, color: borderColor),
                          _InfoRow(
                            icon: Icons.access_time_rounded,
                            label: 'Total Days',
                            value: '${b.totalDays} day${b.totalDays == 1 ? '' : 's'}',
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── SECTION: Partner & Fulfillment ────────────────────────
                    _SectionHeader(label: 'Rental Details', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: sectionBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        children: [
                          _InfoRow(
                            icon: Icons.person_rounded,
                            label: 'Partner',
                            value: partnerDisplay,
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                          Divider(height: 1, color: borderColor),
                          _InfoRow(
                            icon: b.fulfillmentType == 'delivery'
                                ? Icons.local_shipping_rounded
                                : Icons.store_rounded,
                            label: 'Fulfillment',
                            value: b.fulfillmentType == 'delivery'
                                ? 'Delivery'
                                : 'Self-Pickup',
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                          if (b.pickupLocation.isNotEmpty) ...[
                            Divider(height: 1, color: borderColor),
                            _InfoRow(
                              icon: Icons.location_on_rounded,
                              label: 'Pickup Location',
                              value: b.pickupLocation,
                              textPrim: textPrim,
                              textSec: textSec,
                              textMuted: textMuted,
                            ),
                          ],
                          if (b.deliveryAddress.isNotEmpty) ...[
                            Divider(height: 1, color: borderColor),
                            _InfoRow(
                              icon: Icons.pin_drop_rounded,
                              label: 'Delivery Address',
                              value: b.deliveryAddress,
                              textPrim: textPrim,
                              textSec: textSec,
                              textMuted: textMuted,
                              multiLine: true,
                            ),
                          ],
                          if (b.specialRequests.isNotEmpty) ...[
                            Divider(height: 1, color: borderColor),
                            _InfoRow(
                              icon: Icons.notes_rounded,
                              label: 'Special Requests',
                              value: b.specialRequests,
                              textPrim: textPrim,
                              textSec: textSec,
                              textMuted: textMuted,
                              multiLine: true,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── SECTION: Payment ──────────────────────────────────────
                    _SectionHeader(label: 'Payment', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: sectionBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        children: [
                          _InfoRow(
                            icon: Icons.credit_card_rounded,
                            label: 'Payment Method',
                            value: b.paymentMethod.toUpperCase(),
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                          Divider(height: 1, color: borderColor),
                          _InfoRow(
                            icon: Icons.receipt_rounded,
                            label: 'Payment Status',
                            value: _cap(b.paymentStatus),
                            valueColor: b.paymentStatus == 'paid'
                                ? AppColors.success
                                : b.paymentStatus == 'pending'
                                    ? AppColors.statusPending
                                    : null,
                            textPrim: textPrim,
                            textSec: textSec,
                            textMuted: textMuted,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── SECTION: Price Breakdown ──────────────────────────────
                    _SectionHeader(label: 'Price Breakdown', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: sectionBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          // Daily rate × days
                          _PriceRow(
                            label: '₱${b.pricePerDay.toStringAsFixed(0)}/day × ${b.totalDays} day${b.totalDays == 1 ? '' : 's'}',
                            value: '₱${subtotal.toStringAsFixed(0)}',
                            textPrim: textPrim,
                            textSec: textSec,
                          ),
                          const SizedBox(height: 8),

                          // Booking fee
                          _PriceRow(
                            label: 'Platform booking fee',
                            value: '₱${bookingFee.toStringAsFixed(0)}',
                            textPrim: textPrim,
                            textSec: textSec,
                            valueColor: textSec,
                            hint: 'One-time fee',
                          ),

                          // Divider
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Divider(color: borderColor, height: 1),
                          ),

                          // Total
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total to pay partner',
                                style: TextStyle(
                                    color: textPrim,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700),
                              ),
                              Text(
                                '₱${total.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Payment note
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(
                                  isDark ? 0.12 : 0.08),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                  color: AppColors.success.withOpacity(0.3)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  b.paymentMethod == 'gcash'
                                      ? Icons.chat_bubble_rounded
                                      : Icons.payments_rounded,
                                  color: AppColors.success,
                                  size: 14,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    b.paymentMethod == 'gcash'
                                        ? 'After approval, coordinate GCash payment via chat with $partnerDisplay.'
                                        : 'Pay the full amount in cash to $partnerDisplay on pickup/delivery day.',
                                    style: TextStyle(
                                        color: AppColors.success
                                            .withOpacity(0.9),
                                        fontSize: 11,
                                        height: 1.4),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── ACTION BUTTONS ────────────────────────────────────────

                    // Message Partner — always shown
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.chat_bubble_rounded, size: 17),
                        label: Text('Message $partnerDisplay'),
                        onPressed: () {
                          Navigator.of(context).pop();
                          context.push('/chat/${b.id}', extra: {
                            'receiverId': b.partnerUserId.isNotEmpty
                                ? b.partnerUserId
                                : null,
                            'name':    partnerDisplay,
                            'carName': b.carName,
                          });
                        },
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Cancel — only when allowed
                    if (b.canCancel)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _cancelling
                              ? null
                              : () => _handleCancel(context),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.error),
                          child: _cancelling
                              ? const SizedBox(
                                  width: 20, height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                              : const Text('Cancel Booking'),
                        ),
                      ),

                    const SizedBox(height: 8),

                    // Close button
                    SizedBox(
                      width: double.infinity,
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text('Close',
                            style: TextStyle(
                                color: textMuted, fontSize: 14)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String label;
  final Color textMuted;
  const _SectionHeader({required this.label, required this.textMuted});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: TextStyle(
        color: textMuted,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
      ),
    );
  }
}

// ── Info row (icon + label + value) ──────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color textPrim, textSec, textMuted;
  final Color? valueColor;
  final bool multiLine;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    this.valueColor,
    this.multiLine = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment:
            multiLine ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          Icon(icon, size: 16, color: textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        color: textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: valueColor ?? textPrim,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    height: multiLine ? 1.5 : 1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Price row ─────────────────────────────────────────────────────────────────
class _PriceRow extends StatelessWidget {
  final String label, value;
  final Color textPrim, textSec;
  final Color? valueColor;
  final String? hint;

  const _PriceRow({
    required this.label,
    required this.value,
    required this.textPrim,
    required this.textSec,
    this.valueColor,
    this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(color: textSec, fontSize: 13)),
              if (hint != null)
                Text(hint!,
                    style: TextStyle(
                        color: textSec.withOpacity(0.6), fontSize: 10)),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? textPrim,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
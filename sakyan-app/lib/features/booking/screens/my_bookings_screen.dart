import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../models/booking_model.dart';
import '../providers/booking_provider.dart';

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

  // Track previous statuses to detect changes → show toast
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

  // Re-check when app comes back to foreground
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refresh();
    }
  }

  void _startPolling() {
    // Poll every 8 seconds for booking status updates
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      if (mounted) _silentRefresh();
    });
  }

  Future<void> _refresh() async {
    ref.invalidate(myBookingsProvider);
  }

  /// Refresh without showing the loading spinner — diff statuses and toast changes
  Future<void> _silentRefresh() async {
    try {
      final fresh = await ref.read(bookingRepositoryProvider).getMyBookings();
      final current = ref.read(myBookingsProvider).value ?? [];

      // Build map of current statuses
      final currentMap = {for (final b in current) b.id: b.bookingStatus};

      for (final b in fresh) {
        final prev = _prevStatuses[b.id] ?? currentMap[b.id];
        if (prev != null && prev != b.bookingStatus && mounted) {
          _showStatusToast(b);
        }
        _prevStatuses[b.id] = b.bookingStatus;
      }

      // Update the provider state directly
      ref.invalidate(myBookingsProvider);
    } catch (_) {
      // Silent — don't interrupt the user
    }
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
                  Text(
                    'Booking Update',
                    style: const TextStyle(
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
        return (
          Icons.check_circle_rounded,
          AppColors.success,
          '$carName booking was approved! 🎉'
        );
      case 'rejected':
        return (
          Icons.cancel_rounded,
          AppColors.error,
          '$carName booking was rejected.'
        );
      case 'active':
        return (
          Icons.directions_car_rounded,
          AppColors.statusActive,
          '$carName rental is now active. Safe travels!'
        );
      case 'completed':
        return (
          Icons.flag_rounded,
          AppColors.statusCompleted,
          '$carName rental completed. Thanks for riding!'
        );
      case 'cancelled':
        return (
          Icons.block_rounded,
          AppColors.statusCancelled,
          '$carName booking was cancelled.'
        );
      default:
        return (
          Icons.info_rounded,
          AppColors.info,
          'Booking status updated.'
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(myBookingsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    // Sync previous statuses on first load
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
          // Manual refresh button
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Filter chips ──────────────────────────────────────────────────
          _FilterBar(
            selected: _filter,
            onChanged: (f) => setState(() => _filter = f),
            isDark: isDark,
            bookings: bookingsAsync.value ?? [],
          ),

          // ── Content ───────────────────────────────────────────────────────
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
                      onCancel: _refresh,
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textSec: textSec,
                      textMuted: textMuted,
                      isDark: isDark,
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
            Icon(
              filter.icon,
              size: 14,
              color: isSelected ? color : textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              filter.label,
              style: TextStyle(
                fontSize:   13,
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
                    fontSize:   10,
                    fontWeight: FontWeight.w700,
                    color:      isSelected ? color : textMuted,
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
              style: TextStyle(color: textMuted, fontSize: 15, fontWeight: FontWeight.w600)),
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

// ── Booking card ──────────────────────────────────────────────────────────────
class _BookingCard extends StatefulWidget {
  final BookingModel booking;
  final VoidCallback onCancel;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;
  final bool isDark;

  const _BookingCard({
    required this.booking,
    required this.onCancel,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.isDark,
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

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Keep it')),
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
        await ref
            .read(bookingRepositoryProvider)
            .cancelBooking(widget.booking.id);
        widget.onCancel();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.check_rounded, color: Colors.white, size: 16),
                  SizedBox(width: 8),
                  Text('Booking cancelled'),
                ],
              ),
              backgroundColor: AppColors.statusCancelled,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            ),
          );
        }
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
    final ref = ProviderScope.containerOf(context);
    final b = widget.booking;
    final statusColor = _statusColor(b.bookingStatus);
    final statusIcon  = _statusIcon(b.bookingStatus);

    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        decoration: BoxDecoration(
          color: widget.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _expanded
                ? statusColor.withOpacity(0.4)
                : widget.borderColor,
          ),
          boxShadow: _expanded
              ? [
                  BoxShadow(
                    color: statusColor.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : [],
        ),
        child: Column(
          children: [
            // ── Header row ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Status badge icon
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: statusColor.withOpacity(0.3)),
                    ),
                    child: Icon(statusIcon, color: statusColor, size: 20),
                  ),
                  const SizedBox(width: 12),

                  // Car + date info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          b.carName.isEmpty ? 'Car Booking' : b.carName,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: widget.textPrim,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(Icons.calendar_today_rounded,
                                size: 11, color: widget.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              '${b.startDate}  →  ${b.endDate}',
                              style: TextStyle(
                                  color: widget.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          b.bookingCode,
                          style: TextStyle(
                            color: widget.textSec,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Price + status
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₱${b.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
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
                      Icon(
                        _expanded
                            ? Icons.keyboard_arrow_up_rounded
                            : Icons.keyboard_arrow_down_rounded,
                        size: 16,
                        color: widget.textMuted,
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
                borderColor: widget.borderColor,
                isDark: widget.isDark,
              ),

            // ── Expanded detail ─────────────────────────────────────────────
            if (_expanded)
              _ExpandedDetail(
                booking: b,
                textPrim: widget.textPrim,
                textSec: widget.textSec,
                textMuted: widget.textMuted,
                borderColor: widget.borderColor,
                isDark: widget.isDark,
                onCancel: () => _cancel(context, ProviderScope.containerOf(context) as WidgetRef),
                onMessage: () {
                  context.push('/chat/${b.id}', extra: {
                    'receiverId': b.partnerUserId.isNotEmpty ? b.partnerUserId : null,
                    'name':    b.partnerName.isNotEmpty ? b.partnerName : 'Partner',
                    'carName': b.carName,
                  });
                },
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
    // Steps: Submitted → Approved → Active → Completed
    final steps = ['Submitted', 'Approved', 'Active', 'Completed'];
    int currentStep;
    if (booking.isPendingReview)    currentStep = 0;
    else if (booking.isApproved)    currentStep = 1;
    else if (booking.isActive)      currentStep = 2;
    else                            currentStep = 3;

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
                // Connector line
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
              return Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 20,
                    height: 20,
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
                        ? const Icon(Icons.check_rounded, size: 11, color: Colors.white)
                        : null,
                  ),
                ],
              );
            }),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: steps.map((s) {
              final idx   = steps.indexOf(s);
              final done  = idx <= currentStep;
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

// ── Expanded detail section ───────────────────────────────────────────────────
class _ExpandedDetail extends StatelessWidget {
  final BookingModel booking;
  final Color textPrim, textSec, textMuted, borderColor;
  final bool isDark;
  final VoidCallback onCancel;
  final VoidCallback onMessage;

  const _ExpandedDetail({
    required this.booking,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.borderColor,
    required this.isDark,
    required this.onCancel,
    required this.onMessage,
  });

  @override
  Widget build(BuildContext context) {
    final b = booking;

    return Column(
      children: [
        Divider(color: borderColor, height: 1),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          child: Column(
            children: [
              // ── Detail rows ───────────────────────────────────────────────
              _Row('Total Days',
                  '${b.totalDays} day${b.totalDays == 1 ? '' : 's'}',
                  textPrim: textPrim, textSec: textSec),
              _Row('Price per Day',
                  '₱${b.pricePerDay.toStringAsFixed(0)}',
                  textPrim: textPrim, textSec: textSec),
              _Row('Payment',
                  b.paymentMethod.toUpperCase(),
                  textPrim: textPrim, textSec: textSec),
              _Row('Fulfillment',
                  b.fulfillmentType == 'delivery'
                      ? 'Delivery'
                      : 'Self-Pickup',
                  textPrim: textPrim, textSec: textSec),

              if (b.partnerName.isNotEmpty)
                _Row('Partner', b.partnerName,
                    textPrim: textPrim, textSec: textSec),

              // Delivery address
              if (b.deliveryAddress.isNotEmpty)
                _WrapRow('Delivery Address', b.deliveryAddress,
                    textPrim: textPrim,
                    textSec: textSec,
                    isDark: isDark),

              if (b.specialRequests.isNotEmpty)
                _WrapRow('Special Requests', b.specialRequests,
                    textPrim: textPrim,
                    textSec: textSec,
                    isDark: isDark),

              const SizedBox(height: 12),

              // ── Action buttons ────────────────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.chat_bubble_rounded, size: 15),
                      label: const Text('Message'),
                      onPressed: onMessage,
                    ),
                  ),
                  if (b.canCancel) ...[
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onCancel,
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
    );
  }
}

class _Row extends StatelessWidget {
  final String label, value;
  final Color textPrim, textSec;
  const _Row(this.label, this.value,
      {required this.textPrim, required this.textSec});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: textSec, fontSize: 13)),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                  color: textPrim, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

class _WrapRow extends StatelessWidget {
  final String label, value;
  final Color textPrim, textSec;
  final bool isDark;
  const _WrapRow(this.label, this.value,
      {required this.textPrim, required this.textSec, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: textSec,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: AppColors.primaryGlow.withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.location_on_outlined,
                    size: 13,
                    color: AppColors.primary.withOpacity(0.8)),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    value,
                    style: TextStyle(
                        color: textPrim,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        height: 1.5),
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
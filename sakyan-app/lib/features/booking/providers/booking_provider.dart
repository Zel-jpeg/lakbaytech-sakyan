import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/api_service.dart';
import '../data/booking_repository.dart';
import '../models/booking_model.dart';

// ── Repository provider ───────────────────────────────────────────────────────
final bookingRepositoryProvider =
    Provider<BookingRepository>((_) => const BookingRepository());

// ── Booking settings — fetched from admin-configurable API ───────────────────
class BookingSettingsModel {
  final double bookingFee;
  const BookingSettingsModel({this.bookingFee = 100.0});

  factory BookingSettingsModel.fromJson(Map<String, dynamic> json) {
    double fee = 100.0;
    final raw = json['booking_fee'];
    if (raw is num) {
      fee = raw.toDouble();
    } else if (raw is String) {
      fee = double.tryParse(raw) ?? 100.0;
    }
    return BookingSettingsModel(bookingFee: fee);
  }
}

final bookingSettingsProvider =
    FutureProvider<BookingSettingsModel>((ref) async {
  try {
    final res = await ApiService.get(ApiConstants.bookingSettings);
    final data = res.data;
    if (data is Map<String, dynamic>) {
      return BookingSettingsModel.fromJson(data);
    }
    return const BookingSettingsModel();
  } catch (_) {
    return const BookingSettingsModel();
  }
});

// ── Booking status toast helper ───────────────────────────────────────────────
//
// Shows a floating SnackBar whenever a booking status changes.
// Attach a GlobalKey<ScaffoldMessengerState> to your root MaterialApp and
// call BookingToastService.show(…) from anywhere.
//
class BookingToastService {
  static final GlobalKey<ScaffoldMessengerState> messengerKey =
      GlobalKey<ScaffoldMessengerState>();

  static void show(BookingModel booking) {
    final (icon, color, title, body) =
        _content(booking.bookingStatus, booking.carName);

    messengerKey.currentState?.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 80),
        backgroundColor: color,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        duration: const Duration(seconds: 5),
        content: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.18),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    body,
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.85),
                        fontSize: 12,
                        height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Shows a toast immediately after a booking is successfully submitted.
  static void showBookingSubmitted(String carName) {
    messengerKey.currentState?.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 80),
        backgroundColor: AppColors.info,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        duration: const Duration(seconds: 4),
        content: Row(
          children: [
            const Icon(Icons.receipt_rounded,
                color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Booking submitted for $carName! Waiting for partner approval.',
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static (IconData, Color, String, String) _content(
      String status, String carName) {
    switch (status) {
      case 'approved':
        return (
          Icons.check_circle_rounded,
          AppColors.success,
          'Booking Approved! 🎉',
          'Your $carName booking was approved. Check your bookings for details.',
        );
      case 'rejected':
        return (
          Icons.cancel_rounded,
          AppColors.error,
          'Booking Rejected',
          'Your $carName booking was rejected by the partner.',
        );
      case 'active':
        return (
          Icons.directions_car_rounded,
          AppColors.statusActive,
          'Rental Active!',
          'Your $carName rental has started. Safe travels!',
        );
      case 'completed':
        return (
          Icons.flag_rounded,
          AppColors.statusCompleted,
          'Rental Completed',
          'Your $carName rental is complete. Hope you enjoyed the ride!',
        );
      case 'cancelled':
        return (
          Icons.block_rounded,
          AppColors.statusCancelled,
          'Booking Cancelled',
          'Your $carName booking has been cancelled.',
        );
      default:
        return (
          Icons.notifications_rounded,
          AppColors.primary,
          'Booking Update',
          'Your $carName booking status has changed.',
        );
    }
  }
}

// ── Customer bookings list (with auto-refresh polling) ────────────────────────
//
// This notifier adds:
//   • 8-second background polling for status changes
//   • Toast notifications when a status change is detected
//   • Immediate invalidation after create/cancel
//
class MyBookingsNotifier extends AsyncNotifier<List<BookingModel>> {
  Timer? _pollTimer;
  final Map<String, String> _lastKnownStatuses = {};

  @override
  Future<List<BookingModel>> build() async {
    // Cancel any existing timer when provider is recreated
    ref.onDispose(() => _pollTimer?.cancel());

    final bookings =
        await ref.read(bookingRepositoryProvider).getMyBookings();
    _seedStatuses(bookings);
    _startPolling();
    return bookings;
  }

  void _seedStatuses(List<BookingModel> bookings) {
    for (final b in bookings) {
      _lastKnownStatuses.putIfAbsent(b.id, () => b.bookingStatus);
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      _silentPoll();
    });
  }

  Future<void> _silentPoll() async {
    try {
      final fresh =
          await ref.read(bookingRepositoryProvider).getMyBookings();

      bool hasChanges = false;
      for (final b in fresh) {
        final prev = _lastKnownStatuses[b.id];
        if (prev != null && prev != b.bookingStatus) {
          // Status changed → show toast
          BookingToastService.show(b);
          hasChanges = true;
        }
        _lastKnownStatuses[b.id] = b.bookingStatus;
      }

      // Seed any new bookings we haven't seen before
      for (final b in fresh) {
        _lastKnownStatuses.putIfAbsent(b.id, () => b.bookingStatus);
      }

      if (hasChanges ||
          (state.value?.length ?? 0) != fresh.length) {
        state = AsyncValue.data(fresh);
      }
    } catch (_) {
      // Silent poll failure — user still sees cached data
    }
  }

  /// Full manual refresh (shows loading indicator briefly)
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final bookings =
          await ref.read(bookingRepositoryProvider).getMyBookings();
      _seedStatuses(bookings);
      return bookings;
    });
  }
}

/// Stream-based provider — replaces the old FutureProvider<List<BookingModel>>.
/// Use `ref.watch(myBookingsProvider)` exactly as before.
final myBookingsProvider =
    AsyncNotifierProvider<MyBookingsNotifier, List<BookingModel>>(
        MyBookingsNotifier.new);

// ── Create booking notifier ───────────────────────────────────────────────────
class CreateBookingNotifier extends AsyncNotifier<BookingModel?> {
  @override
  Future<BookingModel?> build() async => null;

  Future<BookingModel?> create(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(bookingRepositoryProvider).createBooking(data));

    if (state.hasValue && state.value != null) {
      // Show submission toast
      BookingToastService.showBookingSubmitted(
          state.value!.carName.isNotEmpty
              ? state.value!.carName
              : 'your car');

      // Seed the new booking's status so we can detect future changes
      ref.read(myBookingsProvider.notifier)
          ._lastKnownStatuses[state.value!.id] =
          state.value!.bookingStatus;

      // Invalidate list
      ref.invalidate(myBookingsProvider);
    }
    return state.value;
  }
}

final createBookingProvider =
    AsyncNotifierProvider<CreateBookingNotifier, BookingModel?>(
        CreateBookingNotifier.new);
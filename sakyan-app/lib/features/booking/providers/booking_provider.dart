import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../data/booking_repository.dart';
import '../models/booking_model.dart';

// ── Repository provider ───────────────────────────────────────────────────────
final bookingRepositoryProvider =
    Provider<BookingRepository>((_) => const BookingRepository());

// ── Booking settings — fetched from admin-configurable API ───────────────────
//
// The booking fee is no longer hardcoded. The backend exposes
// GET /api/public/booking-settings/ which returns at minimum:
//   { "booking_fee": 100.0 }
//
// Falls back to ₱100 if the request fails so the UI is never broken.
//
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
    // Network failure — return safe default so booking still works
    return const BookingSettingsModel();
  }
});

// ── Customer bookings list ────────────────────────────────────────────────────
final myBookingsProvider = FutureProvider<List<BookingModel>>((ref) async {
  return ref.read(bookingRepositoryProvider).getMyBookings();
});

// ── Create booking notifier ───────────────────────────────────────────────────
class CreateBookingNotifier extends AsyncNotifier<BookingModel?> {
  @override
  Future<BookingModel?> build() async => null;

  Future<BookingModel?> create(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(bookingRepositoryProvider).createBooking(data));
    // Invalidate bookings list to reflect new entry
    if (state.hasValue) ref.invalidate(myBookingsProvider);
    return state.value;
  }
}

final createBookingProvider =
    AsyncNotifierProvider<CreateBookingNotifier, BookingModel?>(
        CreateBookingNotifier.new);
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/booking_repository.dart';
import '../models/booking_model.dart';
final bookingRepositoryProvider =
    Provider<BookingRepository>((_) => const BookingRepository());
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
    state = await AsyncValue.guard(() =>
        ref.read(bookingRepositoryProvider).createBooking(data));
    // Invalidate bookings list to reflect new entry
    if (state.hasValue) ref.invalidate(myBookingsProvider);
    return state.value;
  }
}
final createBookingProvider =
    AsyncNotifierProvider<CreateBookingNotifier, BookingModel?>(
        CreateBookingNotifier.new);
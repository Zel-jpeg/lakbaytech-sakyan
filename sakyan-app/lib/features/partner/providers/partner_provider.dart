import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/booking/models/booking_model.dart';
import '../../../features/cars/models/car_model.dart';
import '../data/partner_repository.dart';
import '../models/partner_model.dart';

// ── Repository ─────────────────────────────────────────────────────────────
final partnerRepositoryProvider =
    Provider<PartnerRepository>((_) => const PartnerRepository());

// ── Partner profile ────────────────────────────────────────────────────────
final partnerProfileProvider = FutureProvider<PartnerModel?>((ref) async {
  return ref.read(partnerRepositoryProvider).getProfile();
});

// ── Partner stats ──────────────────────────────────────────────────────────
final partnerStatsProvider = FutureProvider<PartnerStatsModel>((ref) async {
  return ref.read(partnerRepositoryProvider).getStats();
});

// ── Partner cars ───────────────────────────────────────────────────────────
final partnerCarsProvider = FutureProvider<List<CarModel>>((ref) async {
  return ref.read(partnerRepositoryProvider).getMyCars();
});

// ── Partner bookings ───────────────────────────────────────────────────────
final partnerBookingsProvider = FutureProvider<List<BookingModel>>((ref) async {
  return ref.read(partnerRepositoryProvider).getMyBookings();
});

// ── Toggle availability notifier ───────────────────────────────────────────
class ToggleAvailabilityNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> toggle(String carId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).toggleAvailability(carId));
    if (!state.hasError) ref.invalidate(partnerCarsProvider);
  }
}

final toggleAvailabilityProvider =
    AsyncNotifierProvider<ToggleAvailabilityNotifier, void>(
        ToggleAvailabilityNotifier.new);

// ── Booking action notifier ────────────────────────────────────────────────
class BookingActionNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> approve(String id) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).approveBooking(id));
    if (!state.hasError) ref.invalidate(partnerBookingsProvider);
  }

  Future<void> reject(String id, {String reason = ''}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(partnerRepositoryProvider).rejectBooking(id, reason: reason));
    if (!state.hasError) ref.invalidate(partnerBookingsProvider);
  }

  Future<void> complete(String id) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).completeBooking(id));
    if (!state.hasError) ref.invalidate(partnerBookingsProvider);
  }

  Future<void> updatePayment(String id, String status) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).updatePaymentStatus(id, status));
    if (!state.hasError) ref.invalidate(partnerBookingsProvider);
  }
}

final bookingActionProvider =
    AsyncNotifierProvider<BookingActionNotifier, void>(
        BookingActionNotifier.new);

// ── Save car notifier (create / edit) ─────────────────────────────────────
//
// FIX: The method was previously named `update(String id, Map data)`.
// Riverpod's AsyncNotifier base class already defines a built-in method
// called `update(FutureOr<State> Function(State) cb)`, so our override
// caused a signature-mismatch compile error.
// Renamed to `updateCar` to avoid the conflict.
// ──────────────────────────────────────────────────────────────────────────
class SaveCarNotifier extends AsyncNotifier<CarModel?> {
  @override
  Future<CarModel?> build() async => null;

  Future<CarModel?> create(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).createCar(data));
    if (!state.hasError) ref.invalidate(partnerCarsProvider);
    return state.value;
  }

  /// Renamed from `update` → `updateCar` to avoid conflict with
  /// Riverpod's built-in `AsyncNotifier.update`.
  Future<CarModel?> updateCar(String id, Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).updateCar(id, data));
    if (!state.hasError) ref.invalidate(partnerCarsProvider);
    return state.value;
  }
}

final saveCarProvider =
    AsyncNotifierProvider<SaveCarNotifier, CarModel?>(() => SaveCarNotifier());

// ── Apply as partner notifier ──────────────────────────────────────────────
class ApplyPartnerNotifier extends AsyncNotifier<PartnerModel?> {
  @override
  Future<PartnerModel?> build() async => null;

  Future<PartnerModel?> apply(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(partnerRepositoryProvider).applyAsPartner(data));
    if (!state.hasError) ref.invalidate(partnerProfileProvider);
    return state.value;
  }
}

final applyPartnerProvider =
    AsyncNotifierProvider<ApplyPartnerNotifier, PartnerModel?>(
        ApplyPartnerNotifier.new);
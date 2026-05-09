import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/cars_repository.dart';
import '../models/car_model.dart';
// ── Repository provider ────────────────────────────────────────────────────
final carsRepositoryProvider =
    Provider<CarsRepository>((_) => const CarsRepository());
// ── Filter state ───────────────────────────────────────────────────────────
class CarFilters {
  final String search;
  final String? transmission; // 'manual' | 'automatic' | null = any
  final String? fuelType;
  final double? maxPrice;
  const CarFilters({
    this.search       = '',
    this.transmission,
    this.fuelType,
    this.maxPrice,
  });
  CarFilters copyWith({
    String? search,
    Object? transmission = _sentinel,
    Object? fuelType     = _sentinel,
    Object? maxPrice     = _sentinel,
  }) =>
      CarFilters(
        search:       search       ?? this.search,
        transmission: transmission == _sentinel
            ? this.transmission
            : transmission as String?,
        fuelType:     fuelType == _sentinel ? this.fuelType : fuelType as String?,
        maxPrice:     maxPrice == _sentinel ? this.maxPrice : maxPrice as double?,
      );
  bool get hasActiveFilters =>
      search.isNotEmpty || transmission != null || fuelType != null || maxPrice != null;
  static const _sentinel = Object();
}
final carFiltersProvider = StateProvider<CarFilters>((_) => const CarFilters());
// ── Cars list provider (reacts to filters) ─────────────────────────────────
final carsListProvider = FutureProvider<List<CarModel>>((ref) async {
  final filters = ref.watch(carFiltersProvider);
  return ref.read(carsRepositoryProvider).getCars(
    search:       filters.search,
    transmission: filters.transmission,
    fuelType:     filters.fuelType,
    maxPrice:     filters.maxPrice,
  );
});
// ── Single car provider ────────────────────────────────────────────────────
final carDetailProvider =
    FutureProvider.family<CarModel, String>((ref, id) async {
  return ref.read(carsRepositoryProvider).getCarById(id);
});
// ── Booked dates provider ──────────────────────────────────────────────────
final bookedDatesProvider =
    FutureProvider.family<List<Map<String, String>>, String>((ref, carId) async {
  return ref.read(carsRepositoryProvider).getBookedDates(carId);
});
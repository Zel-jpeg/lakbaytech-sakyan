import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/cars_repository.dart';
import '../models/car_model.dart';

// ── Repository provider ────────────────────────────────────────────────────
final carsRepositoryProvider =
    Provider<CarsRepository>((_) => const CarsRepository());

// ── Sort options ───────────────────────────────────────────────────────────
enum CarSortBy {
  recommended,
  priceLow,
  priceHigh,
  newest,
}

extension CarSortByX on CarSortBy {
  String get label {
    switch (this) {
      case CarSortBy.recommended: return 'Recommended';
      case CarSortBy.priceLow:    return 'Price: Low to High';
      case CarSortBy.priceHigh:   return 'Price: High to Low';
      case CarSortBy.newest:      return 'Newest First';
    }
  }
}

// ── Filter state ───────────────────────────────────────────────────────────
class CarFilters {
  final String search;
  final String? transmission;   // 'manual' | 'automatic' | null = any
  final String? fuelType;
  final double? maxPrice;
  final double? minPrice;
  final int?    minSeats;
  final bool    availableOnly;
  final CarSortBy sortBy;

  const CarFilters({
    this.search        = '',
    this.transmission,
    this.fuelType,
    this.maxPrice,
    this.minPrice,
    this.minSeats,
    this.availableOnly = false,
    this.sortBy        = CarSortBy.recommended,
  });

  CarFilters copyWith({
    String?  search,
    Object?  transmission  = _sentinel,
    Object?  fuelType      = _sentinel,
    Object?  maxPrice      = _sentinel,
    Object?  minPrice      = _sentinel,
    Object?  minSeats      = _sentinel,
    bool?    availableOnly,
    CarSortBy? sortBy,
  }) =>
      CarFilters(
        search:        search        ?? this.search,
        transmission:  transmission  == _sentinel ? this.transmission  : transmission  as String?,
        fuelType:      fuelType      == _sentinel ? this.fuelType      : fuelType      as String?,
        maxPrice:      maxPrice      == _sentinel ? this.maxPrice      : maxPrice      as double?,
        minPrice:      minPrice      == _sentinel ? this.minPrice      : minPrice      as double?,
        minSeats:      minSeats      == _sentinel ? this.minSeats      : minSeats      as int?,
        availableOnly: availableOnly ?? this.availableOnly,
        sortBy:        sortBy        ?? this.sortBy,
      );

  // Count of active non-search filters (for badge)
  int get activeFilterCount {
    int n = 0;
    if (transmission != null)   n++;
    if (fuelType != null)       n++;
    if (maxPrice != null)       n++;
    if (minPrice != null)       n++;
    if (minSeats != null)       n++;
    if (availableOnly)          n++;
    if (sortBy != CarSortBy.recommended) n++;
    return n;
  }

  bool get hasActiveFilters =>
      search.isNotEmpty || activeFilterCount > 0;

  static const _sentinel = Object();
}

final carFiltersProvider = StateProvider<CarFilters>((_) => const CarFilters());

// ── Cars list provider (reacts to filters, applies client-side sort) ────────
final carsListProvider = FutureProvider<List<CarModel>>((ref) async {
  final filters = ref.watch(carFiltersProvider);
  var cars = await ref.read(carsRepositoryProvider).getCars(
    search:       filters.search,
    transmission: filters.transmission,
    fuelType:     filters.fuelType,
    maxPrice:     filters.maxPrice,
    minSeats:     filters.minSeats,
  );

  // Client-side filters not supported by the backend
  if (filters.minPrice != null) {
    cars = cars.where((c) => c.pricePerDay >= filters.minPrice!).toList();
  }
  if (filters.availableOnly) {
    cars = cars.where((c) => c.isAvailable).toList();
  }

  // Sort
  switch (filters.sortBy) {
    case CarSortBy.priceLow:
      cars.sort((a, b) => a.pricePerDay.compareTo(b.pricePerDay));
    case CarSortBy.priceHigh:
      cars.sort((a, b) => b.pricePerDay.compareTo(a.pricePerDay));
    case CarSortBy.newest:
      // Use year as proxy; cars without year go last
      cars.sort((a, b) => (b.year ?? 0).compareTo(a.year ?? 0));
    case CarSortBy.recommended:
      // Default server order — available cars first
      cars.sort((a, b) {
        if (a.isAvailable == b.isAvailable) return 0;
        return a.isAvailable ? -1 : 1;
      });
  }

  return cars;
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
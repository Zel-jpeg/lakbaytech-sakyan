import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';

class CarsListScreen extends ConsumerStatefulWidget {
  const CarsListScreen({super.key});
  @override
  ConsumerState<CarsListScreen> createState() => _CarsListScreenState();
}
class _CarsListScreenState extends ConsumerState<CarsListScreen> {
  final _searchCtrl = TextEditingController();
  static const _transmissions = ['Any', 'Manual', 'Automatic'];
  static const _fuelTypes     = ['Any', 'Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
  void _updateFilter(CarFilters Function(CarFilters) updater) {
    final current = ref.read(carFiltersProvider);
    ref.read(carFiltersProvider.notifier).state = updater(current);
  }
  void _clearFilters() {
    _searchCtrl.clear();
    ref.read(carFiltersProvider.notifier).state = const CarFilters();
  }
  @override
  Widget build(BuildContext context) {
    final filters   = ref.watch(carFiltersProvider);
    final carsAsync = ref.watch(carsListProvider);
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Browse Cars'),
        actions: [
          if (filters.hasActiveFilters)
            TextButton(
              onPressed: _clearFilters,
              child: const Text('Clear', style: TextStyle(color: AppColors.primary)),
            ),
        ],
      ),
      body: Column(
        children: [
          // ── Search & Filters ──────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => _updateFilter((f) => f.copyWith(search: v)),
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText:    'Search cars...',
                    prefixIcon:  const Icon(Icons.search_rounded, color: AppColors.textMuted),
                    suffixIcon:  _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                            onPressed: () {
                              _searchCtrl.clear();
                              _updateFilter((f) => f.copyWith(search: ''));
                            },
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 12),
                // Filter chips — Transmission
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _FilterLabel(label: 'Transmission:'),
                      ..._transmissions.map((t) {
                        final val = t == 'Any' ? null : t.toLowerCase();
                        final sel = filters.transmission == val;
                        return _Chip(
                          label:    t,
                          selected: sel,
                          onTap:    () => _updateFilter((f) => f.copyWith(transmission: val)),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Filter chips — Fuel
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _FilterLabel(label: 'Fuel:'),
                      ..._fuelTypes.map((t) {
                        final val = t == 'Any' ? null : t.toLowerCase();
                        final sel = filters.fuelType == val;
                        return _Chip(
                          label:    t,
                          selected: sel,
                          onTap:    () => _updateFilter((f) => f.copyWith(fuelType: val)),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
          // ── Cars Grid ─────────────────────────────────────────────
          Expanded(
            child: carsAsync.when(
              loading: () => _buildShimmerGrid(),
              error:   (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.textMuted),
                    const SizedBox(height: 12),
                    const Text('Failed to load cars', style: TextStyle(color: AppColors.textMuted)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(carsListProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (cars) {
                if (cars.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.directions_car_rounded, size: 64, color: AppColors.textMuted),
                        SizedBox(height: 12),
                        Text('No cars found', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
                        SizedBox(height: 4),
                        Text('Try adjusting your filters', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      ],
                    ),
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:    2,
                    crossAxisSpacing:  12,
                    mainAxisSpacing:   12,
                    childAspectRatio:  0.72,
                  ),
                  itemCount: cars.length,
                  itemBuilder: (_, i) => _CarListCard(car: cars[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  Widget _buildShimmerGrid() => GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.72,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor:      AppColors.bgSurface,
          highlightColor: AppColors.bgElevated,
          child: Container(decoration: BoxDecoration(color: AppColors.bgSurface, borderRadius: BorderRadius.circular(16))),
        ),
      );
}
// ── Car list card ─────────────────────────────────────────────────────────────
class _CarListCard extends StatelessWidget {
  final CarModel car;
  const _CarListCard({required this.car});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/cars/${car.id}'),
      child: Container(
        decoration: BoxDecoration(
          color:        AppColors.bgSurface,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: car.primaryImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: car.primaryImageUrl!,
                            fit:      BoxFit.cover,
                            width:    double.infinity,
                            placeholder: (_, __) => Container(color: AppColors.bgElevated),
                            errorWidget: (_, __, ___) => Container(
                              color: AppColors.bgElevated,
                              child: const Icon(Icons.directions_car_rounded, color: AppColors.textMuted, size: 40),
                            ),
                          )
                        : Container(
                            color: AppColors.bgElevated,
                            child: const Icon(Icons.directions_car_rounded, color: AppColors.textMuted, size: 40),
                          ),
                  ),
                  // Availability badge
                  if (!car.isAvailable)
                    Positioned(
                      top: 8, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color:        Colors.black54,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Unavailable', style: TextStyle(color: Colors.white, fontSize: 10)),
                      ),
                    ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(car.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Row(children: [
                    const Icon(Icons.location_on_rounded, size: 11, color: AppColors.textMuted),
                    const SizedBox(width: 2),
                    Expanded(child: Text(car.location, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted))),
                  ]),
                  const SizedBox(height: 4),
                  Row(children: [
                    _SpecChip(icon: Icons.settings_rounded, label: car.transmissionLabel),
                    const SizedBox(width: 4),
                    _SpecChip(icon: Icons.people_rounded, label: '${car.seats}'),
                  ]),
                  const SizedBox(height: 6),
                  Text('₱${car.pricePerDay.toStringAsFixed(0)}/day',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class _SpecChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SpecChip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 10, color: AppColors.textMuted),
        const SizedBox(width: 3),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
      ]),
    );
  }
}
// ── UI helpers ────────────────────────────────────────────────────────────────
class _FilterLabel extends StatelessWidget {
  final String label;
  const _FilterLabel({required this.label});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Center(
          child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
        ),
      );
}
class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Chip({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color:        selected ? AppColors.primary : AppColors.bgSurface,
          borderRadius: BorderRadius.circular(20),
          border:       Border.all(color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color:      selected ? Colors.white : AppColors.textSecondary,
            fontSize:   12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

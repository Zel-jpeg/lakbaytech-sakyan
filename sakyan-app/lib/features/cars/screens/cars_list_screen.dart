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
    final theme     = Theme.of(context);
    final isDark    = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface   : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border       : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary  : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary: AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted    : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgSurface    : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated   : AppColors.bgSubtleLight;
    final elevBg      = isDark ? AppColors.bgElevated   : AppColors.bgElevatedLight;

    return Scaffold(
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
          // ── Search & Filters ────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => _updateFilter((f) => f.copyWith(search: v)),
                  style: TextStyle(color: textPrim),
                  decoration: InputDecoration(
                    hintText:   'Search cars...',
                    prefixIcon: Icon(Icons.search_rounded, color: textMuted),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.close_rounded, color: textMuted),
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
                      _FilterLabel(label: 'Transmission:', color: textMuted),
                      ..._transmissions.map((t) {
                        final val = t == 'Any' ? null : t.toLowerCase();
                        final sel = filters.transmission == val;
                        return _Chip(
                          label:    t,
                          selected: sel,
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textSec: textSec,
                          onTap: () => _updateFilter((f) => f.copyWith(transmission: val)),
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
                      _FilterLabel(label: 'Fuel:', color: textMuted),
                      ..._fuelTypes.map((t) {
                        final val = t == 'Any' ? null : t.toLowerCase();
                        final sel = filters.fuelType == val;
                        return _Chip(
                          label:    t,
                          selected: sel,
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textSec: textSec,
                          onTap: () => _updateFilter((f) => f.copyWith(fuelType: val)),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),

          // ── Cars Grid ───────────────────────────────────────────────
          Expanded(
            child: carsAsync.when(
              loading: () => GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 12,
                  mainAxisSpacing: 12, childAspectRatio: 0.72,
                ),
                itemCount: 6,
                itemBuilder: (_, __) => Shimmer.fromColors(
                  baseColor:      shimBase,
                  highlightColor: shimHigh,
                  child: Container(
                    decoration: BoxDecoration(
                      color: shimBase,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load cars', style: TextStyle(color: textMuted)),
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
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.directions_car_rounded, size: 64, color: textMuted),
                        const SizedBox(height: 12),
                        Text('No cars found',
                            style: TextStyle(color: textMuted, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text('Try adjusting your filters',
                            style: TextStyle(color: textMuted, fontSize: 13)),
                      ],
                    ),
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:   2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing:  12,
                    childAspectRatio: 0.72,
                  ),
                  itemCount: cars.length,
                  itemBuilder: (_, i) => _CarListCard(
                    car: cars[i],
                    cardColor:   cardColor,
                    borderColor: borderColor,
                    textPrim:    textPrim,
                    textMuted:   textMuted,
                    textSec:     textSec,
                    shimBase:    shimBase,
                    elevBg:      elevBg,
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

// ── Car list card ─────────────────────────────────────────────────────────────
class _CarListCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, textSec, shimBase, elevBg;
  const _CarListCard({
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.textSec,
    required this.shimBase,
    required this.elevBg,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/cars/${car.id}'),
      child: Container(
        decoration: BoxDecoration(
          color:        cardColor,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                            placeholder: (_, __) => Container(color: shimBase),
                            errorWidget: (_, __, ___) => Container(
                              color: shimBase,
                              child: Icon(Icons.directions_car_rounded,
                                  color: textMuted, size: 40),
                            ),
                          )
                        : Container(
                            color: shimBase,
                            child: Icon(Icons.directions_car_rounded,
                                color: textMuted, size: 40),
                          ),
                  ),
                  if (!car.isAvailable)
                    Positioned(
                      top: 8, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Unavailable',
                            style: TextStyle(color: Colors.white, fontSize: 10)),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(car.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600, color: textPrim)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Icon(Icons.location_on_rounded, size: 11, color: textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                        child: Text(car.location,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 11, color: textMuted))),
                  ]),
                  const SizedBox(height: 4),
                  Row(children: [
                    _SpecChip(
                        icon: Icons.settings_rounded,
                        label: car.transmissionLabel,
                        bg: elevBg,
                        border: borderColor,
                        text: textSec),
                    const SizedBox(width: 4),
                    _SpecChip(
                        icon: Icons.people_rounded,
                        label: '${car.seats}',
                        bg: elevBg,
                        border: borderColor,
                        text: textSec),
                  ]),
                  const SizedBox(height: 6),
                  Text('₱${car.pricePerDay.toStringAsFixed(0)}/day',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary)),
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
  final Color bg, border, text;
  const _SpecChip({
    required this.icon,
    required this.label,
    required this.bg,
    required this.border,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 10, color: text),
        const SizedBox(width: 3),
        Text(label, style: TextStyle(fontSize: 10, color: text)),
      ]),
    );
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
class _FilterLabel extends StatelessWidget {
  final String label;
  final Color color;
  const _FilterLabel({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Center(
          child: Text(label, style: TextStyle(color: color, fontSize: 12)),
        ),
      );
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color cardColor, borderColor, textSec;
  final VoidCallback onTap;
  const _Chip({
    required this.label,
    required this.selected,
    required this.cardColor,
    required this.borderColor,
    required this.textSec,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color:        selected ? AppColors.primary : cardColor,
          borderRadius: BorderRadius.circular(20),
          border:       Border.all(color: selected ? AppColors.primary : borderColor),
        ),
        child: Text(
          label,
          style: TextStyle(
            color:      selected ? Colors.white : textSec,
            fontSize:   12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}
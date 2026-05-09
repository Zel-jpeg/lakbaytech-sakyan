import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../cars/models/car_model.dart';
import '../providers/partner_provider.dart';

class MyCarsScreen extends ConsumerWidget {
  const MyCarsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final carsAsync = ref.watch(partnerCarsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        title: const Text('My Cars'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
            tooltip: 'Add car',
            onPressed: () => context.push(AppRoutes.addCar),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(AppRoutes.addCar),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Car',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: carsAsync.when(
        loading: () => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          itemBuilder: (_, __) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Shimmer.fromColors(
              baseColor:      shimBase,
              highlightColor: shimHigh,
              child: Container(
                height: 140,
                decoration: BoxDecoration(
                  color: shimBase,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
              const SizedBox(height: 12),
              Text('Failed to load cars',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(partnerCarsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (cars) {
          if (cars.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(Icons.directions_car_rounded,
                          color: AppColors.primary, size: 50),
                    ),
                    const SizedBox(height: 20),
                    Text('No cars listed yet',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: textPrim)),
                    const SizedBox(height: 8),
                    Text(
                      'Add your first car to start earning on Sakyan.',
                      style: TextStyle(
                          color: textSec, fontSize: 14, height: 1.6),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => context.push(AppRoutes.addCar),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text('List My Car'),
                    ),
                  ],
                ),
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(partnerCarsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              itemCount: cars.length,
              itemBuilder: (_, i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _CarCard(
                  car: cars[i],
                  ref: ref,
                  cardColor: cardColor,
                  borderColor: borderColor,
                  textPrim: textPrim,
                  textSec: textSec,
                  textMuted: textMuted,
                  shimBase: shimBase,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Car card ──────────────────────────────────────────────────────────────────
class _CarCard extends StatelessWidget {
  final CarModel car;
  final WidgetRef ref;
  final Color cardColor, borderColor, textPrim, textSec, textMuted, shimBase;
  const _CarCard({
    required this.car,
    required this.ref,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.shimBase,
  });

  Future<void> _delete(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Car'),
        content: Text('Remove "${car.name}" from your listings?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref.read(partnerRepositoryProvider).deleteCar(car.id);
      ref.invalidate(partnerCarsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Delete failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final toggleState = ref.watch(toggleAvailabilityProvider);

    return Container(
      decoration: BoxDecoration(
        color:        cardColor,
        borderRadius: BorderRadius.circular(16),
        border:       Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          // ── Car image ────────────────────────────────────────────────
          ClipRRect(
            borderRadius:
                const BorderRadius.horizontal(left: Radius.circular(16)),
            child: SizedBox(
              width: 110,
              height: 140,
              child: car.primaryImageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: car.primaryImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: shimBase),
                      errorWidget: (_, __, ___) => Container(
                        color: shimBase,
                        child: Icon(Icons.directions_car_rounded,
                            color: textMuted, size: 36),
                      ),
                    )
                  : Container(
                      color: shimBase,
                      child: Icon(Icons.directions_car_rounded,
                          color: textMuted, size: 36),
                    ),
            ),
          ),

          // ── Info ─────────────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(car.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: textPrim)),
                      ),
                      // Availability toggle
                      GestureDetector(
                        onTap: toggleState.isLoading
                            ? null
                            : () => ref
                                .read(toggleAvailabilityProvider.notifier)
                                .toggle(car.id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: car.isAvailable
                                ? AppColors.success.withOpacity(0.12)
                                : AppColors.error.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: car.isAvailable
                                      ? AppColors.success
                                      : AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                car.isAvailable ? 'Active' : 'Hidden',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: car.isAvailable
                                      ? AppColors.success
                                      : AppColors.error,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${car.brand} ${car.model} ${car.year ?? ''}'.trim(),
                    style: TextStyle(color: textSec, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Row(children: [
                    Icon(Icons.location_on_rounded,
                        size: 12, color: textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(car.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: textMuted)),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Text('₱${car.pricePerDay.toStringAsFixed(0)}/day',
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary)),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.edit_rounded, size: 14),
                        label: const Text('Edit'),
                        style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 6)),
                        onPressed: () =>
                            context.push('/partner/cars/${car.id}/edit'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded,
                          color: AppColors.error, size: 20),
                      onPressed: () => _delete(context),
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
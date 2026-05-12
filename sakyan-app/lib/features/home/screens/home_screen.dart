import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';
import '../../home/models/public_stats_model.dart';
import '../../home/providers/home_provider.dart';

// ── Helper ────────────────────────────────────────────────────────────────────
String _capitalize(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

// ── Quick category config ─────────────────────────────────────────────────────
class _QuickCategory {
  final String label;
  final IconData icon;
  final String? transmission;
  final String? fuelType;

  const _QuickCategory({
    required this.label,
    required this.icon,
    this.transmission,
    this.fuelType,
  });
}

const _quickCategories = [
  _QuickCategory(label: 'All Cars',  icon: Icons.directions_car_rounded),
  _QuickCategory(label: 'Automatic', icon: Icons.auto_mode_rounded,        transmission: 'automatic'),
  _QuickCategory(label: 'Manual',    icon: Icons.settings_rounded,          transmission: 'manual'),
  _QuickCategory(label: 'Electric',  icon: Icons.electric_bolt_rounded,     fuelType: 'electric'),
  _QuickCategory(label: 'Diesel',    icon: Icons.local_gas_station_rounded, fuelType: 'diesel'),
  _QuickCategory(label: 'Hybrid',    icon: Icons.eco_rounded,               fuelType: 'hybrid'),
];

// ── HomeScreen ────────────────────────────────────────────────────────────────
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user          = ref.watch(currentUserProvider);
    final featuredAsync = ref.watch(featuredCarsProvider);
    final statsAsync    = ref.watch(publicStatsProvider);
    final session       = ref.watch(sessionGreetingProvider);
    final theme         = Theme.of(context);
    final isDark        = theme.brightness == Brightness.dark;

    // Adaptive colors
    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;

    final firstName = _capitalize(
      user?.fullName.trim().split(' ').first ?? 'there',
    );

    // ── Category tap — sets filter in cars provider THEN navigates ─────────
    void onCategoryTap(_QuickCategory cat) {
      ref.read(carFiltersProvider.notifier).state = CarFilters(
        transmission: cat.transmission,
        fuelType: cat.fuelType,
      );
      context.go(AppRoutes.cars);
    }

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: CustomScrollView(
        slivers: [

          // ── App Bar ───────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 0,
            floating: true,
            pinned: false,
            backgroundColor: scaffoldBg,
            title: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/icon.png',
                    width: 32,
                    height: 32,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Icon(Icons.directions_car_filled_rounded,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Sakyan',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textPrim,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.notifications_outlined, color: textPrim),
                onPressed: () => context.push(AppRoutes.notifications),
              ),
            ],
          ),

          // ── Hero Banner (greeting + search) ───────────────────────────────
          SliverToBoxAdapter(
            child: _HeroBanner(
              greeting: session.greeting,
              subtitle: session.subtitle,
              firstName: firstName,
              isDark: isDark,
              onSearchTap: () => context.go(AppRoutes.cars),
            ),
          ),

          // ── Stats Strip ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: statsAsync.when(
              loading: () => _StatsStripShimmer(
                  shimBase: shimBase, shimHigh: shimHigh),
              error: (_, __) => const SizedBox.shrink(),
              data: (PublicStatsModel stats) => _StatsStrip(
                stats: stats,
                cardColor: cardColor,
                borderColor: borderColor,
                textPrim: textPrim,
                textMuted: textMuted,
              ),
            ),
          ),

          // ── Quick Categories ──────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _QuickCategories(
              isDark: isDark,
              textPrim: textPrim,
              textMuted: textMuted,
              borderColor: borderColor,
              cardColor: cardColor,
              onTap: onCategoryTap,
            ),
          ),

          // ── Featured Cars section header ──────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Featured Cars',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: textPrim,
                        ),
                      ),
                      // "Showing 6 of X total" — communicates more exist
                      statsAsync.maybeWhen(
                        data: (PublicStatsModel stats) => Text(
                          stats.totalCars > 0
                              ? 'Showing 6 of ${stats.totalCars} available'
                              : 'Handpicked for you',
                          style: TextStyle(fontSize: 11, color: textMuted),
                        ),
                        orElse: () => Text(
                          'Handpicked for you',
                          style: TextStyle(fontSize: 11, color: textMuted),
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () => context.go(AppRoutes.cars),
                    icon: const Icon(Icons.arrow_forward_rounded,
                        size: 14, color: AppColors.primary),
                    label: const Text(
                      'See all',
                      style: TextStyle(
                          color: AppColors.primary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Featured Cars — 2-column vertical grid ────────────────────────
          featuredAsync.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => _CarCardShimmer(
                      base: shimBase, highlight: shimHigh),
                  childCount: 4,
                ),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount:   2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing:  12,
                  childAspectRatio: 0.72,
                ),
              ),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off_rounded,
                        size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load cars',
                        style:
                            TextStyle(color: textMuted, fontSize: 15)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () =>
                          ref.invalidate(featuredCarsProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
            data: (cars) => SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _CarCard(
                    car:         cars[i],
                    cardColor:   cardColor,
                    borderColor: borderColor,
                    textPrim:    textPrim,
                    textMuted:   textMuted,
                    shimBase:    shimBase,
                  ),
                  childCount: cars.length,
                ),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount:   2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing:  12,
                  childAspectRatio: 0.72,
                ),
              ),
            ),
          ),

          // ── "See All" pill — intentional end to the featured grid ─────────
          //
          // This row appears directly below the last grid row so users
          // immediately understand these are just featured picks, not the
          // entire catalogue.
          //
          SliverToBoxAdapter(
            child: featuredAsync.maybeWhen(
              data: (_) => _SeeAllRow(
                statsAsync: statsAsync,
                onTap: () => context.go(AppRoutes.cars),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          ),

          // ── Browse All CTA Banner ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: _BrowseAllBanner(
              isDark: isDark,
              statsAsync: statsAsync,
              onTap: () => context.go(AppRoutes.cars),
            ),
          ),

          // ── Bottom padding (clear of nav bar) ─────────────────────────────
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
class _HeroBanner extends StatelessWidget {
  final String greeting, subtitle, firstName;
  final bool isDark;
  final VoidCallback onSearchTap;

  const _HeroBanner({
    required this.greeting,
    required this.subtitle,
    required this.firstName,
    required this.isDark,
    required this.onSearchTap,
  });

  @override
  Widget build(BuildContext context) {
    final textPrim  = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec   = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [const Color(0xFF1A2744), const Color(0xFF0F1117)]
              : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.primary.withOpacity(isDark ? 0.2 : 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting — clean, no icon
          Text(
            '$greeting, $firstName 👋',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: textPrim,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(fontSize: 13, color: textSec),
          ),
          const SizedBox(height: 16),

          // Search bar
          GestureDetector(
            onTap: onSearchTap,
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.bgElevated.withOpacity(0.8)
                    : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color:
                      isDark ? AppColors.border : AppColors.borderLight,
                ),
                boxShadow: isDark
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, color: textMuted, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Search by car, brand, or location…',
                      style: TextStyle(color: textMuted, fontSize: 13),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Filter',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stats Strip ───────────────────────────────────────────────────────────────
class _StatsStrip extends StatelessWidget {
  final PublicStatsModel stats;
  final Color cardColor, borderColor, textPrim, textMuted;

  const _StatsStrip({
    required this.stats,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
  });

  String _fmt(int v, {bool plus = true}) =>
      v > 0 ? '$v${plus ? '+' : ''}' : '—';

  @override
  Widget build(BuildContext context) {
    final items = [
      (label: 'Cars',      value: _fmt(stats.totalCars),             icon: Icons.directions_car_rounded),
      (label: 'Partners',  value: _fmt(stats.totalPartners, plus: false), icon: Icons.store_rounded),
      (label: 'Bookings',  value: _fmt(stats.totalBookings),          icon: Icons.receipt_long_rounded),
      (label: 'Customers', value: _fmt(stats.totalCustomers),         icon: Icons.people_rounded),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: List.generate(items.length, (i) {
          final item = items[i];
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: i < items.length - 1 ? 8 : 0),
              padding: const EdgeInsets.symmetric(
                  vertical: 12, horizontal: 6),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  Icon(item.icon, size: 16, color: AppColors.primary),
                  const SizedBox(height: 4),
                  Text(
                    item.value,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: textPrim,
                    ),
                  ),
                  Text(
                    item.label,
                    style: TextStyle(fontSize: 9, color: textMuted),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _StatsStripShimmer extends StatelessWidget {
  final Color shimBase, shimHigh;
  const _StatsStripShimmer(
      {required this.shimBase, required this.shimHigh});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Shimmer.fromColors(
        baseColor: shimBase,
        highlightColor: shimHigh,
        child: Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i < 3 ? 8 : 0),
                height: 68,
                decoration: BoxDecoration(
                  color: shimBase,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ── Quick Categories ──────────────────────────────────────────────────────────
class _QuickCategories extends StatelessWidget {
  final bool isDark;
  final Color textPrim, textMuted, borderColor, cardColor;
  final void Function(_QuickCategory) onTap;

  const _QuickCategories({
    required this.isDark,
    required this.textPrim,
    required this.textMuted,
    required this.borderColor,
    required this.cardColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Text(
            'Browse by Category',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: textPrim,
            ),
          ),
        ),
        SizedBox(
          height: 86,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemCount: _quickCategories.length,
            itemBuilder: (_, i) {
              final cat = _quickCategories[i];
              final isAllCars =
                  cat.transmission == null && cat.fuelType == null;

              return GestureDetector(
                onTap: () => onTap(cat),
                child: Container(
                  width: 72,
                  decoration: BoxDecoration(
                    color: isAllCars
                        ? AppColors.primary.withOpacity(0.1)
                        : cardColor,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isAllCars ? AppColors.primary : borderColor,
                      width: isAllCars ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: isAllCars
                              ? AppColors.primary
                              : AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          cat.icon,
                          size: 18,
                          color: isAllCars
                              ? Colors.white
                              : AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        cat.label,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isAllCars
                              ? AppColors.primary
                              : textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Car Card (grid item) ──────────────────────────────────────────────────────
class _CarCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, shimBase;

  const _CarCard({
    super.key,
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.shimBase,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/cars/${car.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image + availability badge
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16)),
                    child: car.primaryImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl:    car.primaryImageUrl!,
                            fit:         BoxFit.cover,
                            width:       double.infinity,
                            placeholder: (_, __) =>
                                Container(color: shimBase),
                            errorWidget: (_, __, ___) => _CarPlaceholder(
                                bg: shimBase, iconColor: textMuted),
                          )
                        : _CarPlaceholder(
                            bg: shimBase, iconColor: textMuted),
                  ),
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: car.isAvailable
                            ? AppColors.success
                            : Colors.black54,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        car.isAvailable ? 'Available' : 'Booked',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
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
                  Text(
                    car.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: textPrim,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(children: [
                    Icon(Icons.location_on_rounded,
                        size: 11, color: textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(
                        car.location,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            TextStyle(fontSize: 11, color: textMuted),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₱${car.pricePerDay.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      Text('/day',
                          style: TextStyle(
                              fontSize: 10, color: textMuted)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CarPlaceholder extends StatelessWidget {
  final Color bg, iconColor;
  const _CarPlaceholder({required this.bg, required this.iconColor});

  @override
  Widget build(BuildContext context) => Container(
        color: bg,
        child: Center(
          child: Icon(Icons.directions_car_rounded,
              color: iconColor, size: 40),
        ),
      );
}

class _CarCardShimmer extends StatelessWidget {
  final Color base, highlight;
  const _CarCardShimmer({required this.base, required this.highlight});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor:      base,
      highlightColor: highlight,
      child: Container(
        decoration: BoxDecoration(
          color:        base,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}

// ── "See All" row — intentional end to the featured grid ─────────────────────
//
// Sits directly beneath the last grid row so users understand the grid is
// a curated preview, not the full catalogue.
//
class _SeeAllRow extends StatelessWidget {
  final AsyncValue<PublicStatsModel> statsAsync;
  final VoidCallback onTap;

  const _SeeAllRow({required this.statsAsync, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final totalCars = statsAsync.value?.totalCars ?? 0;
    final label = totalCars > 0
        ? 'View all $totalCars+ cars'
        : 'View all available cars';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.25),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.grid_view_rounded,
                color: AppColors.primary, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.arrow_forward_rounded,
                color: AppColors.primary, size: 14),
          ],
        ),
      ),
    );
  }
}

// ── Browse All CTA Banner ─────────────────────────────────────────────────────
class _BrowseAllBanner extends StatelessWidget {
  final bool isDark;
  final AsyncValue<PublicStatsModel> statsAsync;
  final VoidCallback onTap;

  const _BrowseAllBanner({
    required this.isDark,
    required this.statsAsync,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final totalCars = statsAsync.value?.totalCars ?? 0;
    final headline  = totalCars > 0 ? 'Explore $totalCars+ Cars' : 'Explore All Cars';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    headline,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Filter by type, price, transmission & more',
                    style:
                        TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Browse Now',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_forward_rounded,
                            color: AppColors.primary, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                ),
                const Icon(Icons.directions_car_filled_rounded,
                    color: Colors.white, size: 32),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cars/models/car_model.dart';
import '../../home/providers/home_provider.dart';

// ── Helper ────────────────────────────────────────────────────────────────────
String _capitalize(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

// ── HomeScreen ────────────────────────────────────────────────────────────────
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user          = ref.watch(currentUserProvider);
    final featuredAsync = ref.watch(featuredCarsProvider);
    // Session greeting — stable for the whole app session
    final session       = ref.watch(sessionGreetingProvider);
    final theme         = Theme.of(context);
    final isDark        = theme.brightness == Brightness.dark;

    // Adaptive surface colors
    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final searchBg    = isDark ? AppColors.bgSurface     : AppColors.bgSurfaceLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;

    final firstName = _capitalize(
      user?.fullName.trim().split(' ').first ?? 'there',
    );

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: CustomScrollView(
        slivers: [
          // ── App bar ────────────────────────────────────────────────────────
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

          // ── Body content ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Session greeting (no emoji, no per-minute change) ───────
                  Text(
                    '${session.greeting}, $firstName',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: textPrim,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    session.subtitle,
                    style: TextStyle(color: textSec, fontSize: 14),
                  ),
                  const SizedBox(height: 20),

                  // ── Search bar ────────────────────────────────────────────
                  GestureDetector(
                    onTap: () => context.go(AppRoutes.cars),
                    child: Container(
                      height: 50,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color:        searchBg,
                        borderRadius: BorderRadius.circular(14),
                        border:       Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.search_rounded, color: textMuted, size: 20),
                          const SizedBox(width: 10),
                          Text(
                            'Search cars, locations...',
                            style: TextStyle(color: textMuted, fontSize: 14),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color:        AppColors.primaryGlow,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Filter',
                              style: TextStyle(
                                color:      AppColors.primary,
                                fontSize:   12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ── Featured cars header ───────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Featured Cars',
                        style: TextStyle(
                          fontSize:   18,
                          fontWeight: FontWeight.w700,
                          color:      textPrim,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go(AppRoutes.cars),
                        child: const Text(
                          'See all',
                          style: TextStyle(
                              color: AppColors.primary, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ── Featured cars grid ─────────────────────────────────────────────
          featuredAsync.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, __) =>
                      _CarCardShimmer(base: shimBase, highlight: shimHigh),
                  childCount: 4,
                ),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount:   2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing:  12,
                  childAspectRatio: 0.75,
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
                    Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text(
                      'Failed to load cars',
                      style: TextStyle(color: textMuted, fontSize: 15),
                    ),
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
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _CarCard(
                    car:         cars[i],
                    cardColor:   cardColor,
                    borderColor: borderColor,
                    textPrim:    textPrim,
                    textMuted:   textMuted,
                    shimBase:    shimBase,
                    shimHigh:    shimHigh,
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
        ],
      ),
    );
  }
}

// ── Car Card ──────────────────────────────────────────────────────────────────
class _CarCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, shimBase, shimHigh;

  const _CarCard({
    super.key,
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.shimBase,
    required this.shimHigh,
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
            // Image
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(16)),
                child: car.primaryImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl:    car.primaryImageUrl!,
                        fit:         BoxFit.cover,
                        width:       double.infinity,
                        placeholder: (_, __) => Container(color: shimBase),
                        errorWidget: (_, __, ___) =>
                            _CarPlaceholder(bg: shimBase, iconColor: textMuted),
                      )
                    : _CarPlaceholder(bg: shimBase, iconColor: textMuted),
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
                    maxLines:  1,
                    overflow:  TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize:   13,
                      fontWeight: FontWeight.w600,
                      color:      textPrim,
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
                        style: TextStyle(fontSize: 11, color: textMuted),
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
                          fontSize:   14,
                          fontWeight: FontWeight.w700,
                          color:      AppColors.primary,
                        ),
                      ),
                      Text(
                        '/day',
                        style: TextStyle(fontSize: 10, color: textMuted),
                      ),
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

// ── Shimmer placeholders ──────────────────────────────────────────────────────
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
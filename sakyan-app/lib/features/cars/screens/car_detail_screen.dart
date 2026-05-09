import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';

class CarDetailScreen extends ConsumerStatefulWidget {
  final String carId;
  const CarDetailScreen({super.key, required this.carId});

  @override
  ConsumerState<CarDetailScreen> createState() => _CarDetailScreenState();
}

class _CarDetailScreenState extends ConsumerState<CarDetailScreen> {
  final _pageCtrl = PageController();
  int _currentImg = 0;

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final carAsync = ref.watch(carDetailProvider(widget.carId));
    final user     = ref.watch(currentUserProvider);
    final theme    = Theme.of(context);
    final isDark   = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final elevBg      = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;

    return Scaffold(
      body: carAsync.when(
        loading: () => _buildShimmer(shimBase, shimHigh),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load car details',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.invalidate(carDetailProvider(widget.carId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (car) => _buildContent(
          context, car, user, isDark,
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          textMuted: textMuted,
          elevBg: elevBg,
          shimBase: shimBase,
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    CarModel car,
    dynamic user,
    bool isDark, {
    required Color cardColor,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color textMuted,
    required Color elevBg,
    required Color shimBase,
  }) {
    final scaffoldBg = Theme.of(context).scaffoldBackgroundColor;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // ── Photo Gallery ────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: scaffoldBg,
              leading: GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.arrow_back_rounded,
                      color: Colors.white),
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  children: [
                    car.images.isEmpty
                        ? Container(
                            color: shimBase,
                            child: Center(
                              child: Icon(Icons.directions_car_rounded,
                                  size: 80, color: textMuted),
                            ),
                          )
                        : PageView.builder(
                            controller: _pageCtrl,
                            itemCount: car.images.length,
                            onPageChanged: (i) =>
                                setState(() => _currentImg = i),
                            itemBuilder: (_, i) => CachedNetworkImage(
                              imageUrl: car.images[i].imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (_, __) =>
                                  Container(color: shimBase),
                              errorWidget: (_, __, ___) => Container(
                                color: shimBase,
                                child: Icon(Icons.broken_image_rounded,
                                    color: textMuted, size: 48),
                              ),
                            ),
                          ),
                    if (car.images.length > 1)
                      Positioned(
                        bottom: 12,
                        left: 0,
                        right: 0,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            car.images.length,
                            (i) => AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width:  i == _currentImg ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: i == _currentImg
                                    ? AppColors.primary
                                    : Colors.white54,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: 0, left: 0, right: 0,
                      height: 60,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end:   Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              scaffoldBg.withOpacity(0.8),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Car info body ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name + availability
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(car.name,
                                  style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700,
                                      color: textPrim)),
                              if (car.brand.isNotEmpty || car.year != null)
                                Text(
                                  '${car.brand} ${car.model} ${car.year ?? ''}'
                                      .trim(),
                                  style: TextStyle(
                                      color: textSec, fontSize: 14),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: car.isAvailable
                                ? AppColors.successBg
                                : AppColors.errorBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            car.isAvailable ? 'Available' : 'Unavailable',
                            style: TextStyle(
                              color: car.isAvailable
                                  ? AppColors.success
                                  : AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Location
                    Row(children: [
                      const Icon(Icons.location_on_rounded,
                          size: 15, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(car.location,
                            style: TextStyle(color: textSec, fontSize: 13)),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    Divider(color: borderColor),
                    const SizedBox(height: 20),

                    // ── Specs row ──────────────────────────────────────────
                    Text('Specifications',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textPrim)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _SpecTile(
                          icon: Icons.people_rounded,
                          label: 'Seats',
                          value: '${car.seats}',
                          textPrim: textPrim,
                          textMuted: textMuted,
                          cardColor: cardColor,
                          borderColor: borderColor,
                        ),
                        _SpecTile(
                          icon: Icons.settings_rounded,
                          label: 'Transmission',
                          value: car.transmissionLabel,
                          textPrim: textPrim,
                          textMuted: textMuted,
                          cardColor: cardColor,
                          borderColor: borderColor,
                        ),
                        _SpecTile(
                          icon: Icons.local_gas_station_rounded,
                          label: 'Fuel',
                          value: car.fuelLabel,
                          textPrim: textPrim,
                          textMuted: textMuted,
                          cardColor: cardColor,
                          borderColor: borderColor,
                        ),
                        if (car.color.isNotEmpty)
                          _SpecTile(
                            icon: Icons.palette_rounded,
                            label: 'Color',
                            value: car.color,
                            textPrim: textPrim,
                            textMuted: textMuted,
                            cardColor: cardColor,
                            borderColor: borderColor,
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Description ────────────────────────────────────────
                    if (car.description.isNotEmpty) ...[
                      Text('About',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: textPrim)),
                      const SizedBox(height: 8),
                      Text(car.description,
                          style: TextStyle(
                              color: textSec, fontSize: 14, height: 1.6)),
                      const SizedBox(height: 20),
                    ],

                    // ── Features ───────────────────────────────────────────
                    if (car.features.isNotEmpty) ...[
                      Text('Features',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: textPrim)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: car.features
                            .map((f) => _FeatureChip(
                                  label: f,
                                  elevBg: elevBg,
                                  borderColor: borderColor,
                                  textSec: textSec,
                                ))
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // ── Map ────────────────────────────────────────────────
                    if (car.locationLat != null &&
                        car.locationLng != null) ...[
                      Text('Pickup Location',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: textPrim)),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: SizedBox(
                          height: 200,
                          child: FlutterMap(
                            options: MapOptions(
                              initialCenter: LatLng(
                                  car.locationLat!, car.locationLng!),
                              initialZoom: 14,
                              interactionOptions: const InteractionOptions(
                                flags: InteractiveFlag.none,
                              ),
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.sakyan.app',
                              ),
                              MarkerLayer(markers: [
                                Marker(
                                  point: LatLng(car.locationLat!,
                                      car.locationLng!),
                                  width: 40,
                                  height: 40,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white, width: 2),
                                    ),
                                    child: const Icon(
                                        Icons.directions_car_rounded,
                                        color: Colors.white,
                                        size: 20),
                                  ),
                                ),
                              ]),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),

        // ── Sticky Book Now bar ──────────────────────────────────────────
        Positioned(
          left: 0, right: 0, bottom: 0,
          child: Container(
            padding: EdgeInsets.fromLTRB(
                20, 16, 20, MediaQuery.of(context).padding.bottom + 16),
            decoration: BoxDecoration(
              color:  cardColor,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '₱${car.pricePerDay.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary),
                    ),
                    Text('per day',
                        style: TextStyle(fontSize: 12, color: textMuted)),
                  ],
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: ElevatedButton(
                    onPressed: car.isAvailable && user != null
                        ? () => context.push('/checkout/${car.id}')
                        : null,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      user == null
                          ? 'Sign in to Book'
                          : (car.isAvailable ? 'Book Now' : 'Unavailable'),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildShimmer(Color base, Color highlight) {
    return Shimmer.fromColors(
      baseColor:      base,
      highlightColor: highlight,
      child: Column(children: [
        Container(height: 300, color: base),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(children: [
            Container(height: 24, color: base),
            const SizedBox(height: 8),
            Container(height: 16, width: 200, color: base),
          ]),
        ),
      ]),
    );
  }
}

// ── Spec tile ─────────────────────────────────────────────────────────────────
class _SpecTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color textPrim, textMuted, cardColor, borderColor;

  const _SpecTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.textPrim,
    required this.textMuted,
    required this.cardColor,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(height: 6),
          Text(value,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: textPrim)),
          Text(label,
              style: TextStyle(fontSize: 10, color: textMuted)),
        ]),
      ),
    );
  }
}

// ── Feature chip ──────────────────────────────────────────────────────────────
class _FeatureChip extends StatelessWidget {
  final String label;
  final Color elevBg, borderColor, textSec;
  const _FeatureChip({
    required this.label,
    required this.elevBg,
    required this.borderColor,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: elevBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle_rounded,
            size: 12, color: AppColors.success),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12, color: textSec)),
      ]),
    );
  }
}
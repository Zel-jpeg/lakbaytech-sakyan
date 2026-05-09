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
  final _pageCtrl  = PageController();
  int _currentImg  = 0;

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final carAsync = ref.watch(carDetailProvider(widget.carId));
    final user     = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.bgBase,
      body: carAsync.when(
        loading: () => _buildShimmer(),
        error:   (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              const Text('Failed to load car details', style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => ref.invalidate(carDetailProvider(widget.carId)), child: const Text('Retry')),
            ],
          ),
        ),
        data: (car) => _buildContent(context, car, user),
      ),
    );
  }

  Widget _buildContent(BuildContext context, CarModel car, dynamic user) {
    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // ── Photo Gallery ──────────────────────────────────────
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: AppColors.bgBase,
              leading: GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  children: [
                    // Image carousel
                    car.images.isEmpty
                        ? Container(
                            color: AppColors.bgElevated,
                            child: const Center(
                              child: Icon(Icons.directions_car_rounded, size: 80, color: AppColors.textMuted),
                            ),
                          )
                        : PageView.builder(
                            controller: _pageCtrl,
                            itemCount:  car.images.length,
                            onPageChanged: (i) => setState(() => _currentImg = i),
                            itemBuilder: (_, i) => CachedNetworkImage(
                              imageUrl: car.images[i].imageUrl,
                              fit:      BoxFit.cover,
                              placeholder: (_, __) => Container(color: AppColors.bgElevated),
                              errorWidget: (_, __, ___) => Container(
                                color: AppColors.bgElevated,
                                child: const Icon(Icons.broken_image_rounded, color: AppColors.textMuted, size: 48),
                              ),
                            ),
                          ),
                    // Dot indicators
                    if (car.images.length > 1)
                      Positioned(
                        bottom: 12,
                        left: 0, right: 0,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(car.images.length, (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: i == _currentImg ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _currentImg ? AppColors.primary : Colors.white54,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          )),
                        ),
                      ),
                    // Gradient overlay at bottom
                    Positioned(
                      bottom: 0, left: 0, right: 0,
                      height: 60,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter, end: Alignment.bottomCenter,
                            colors: [Colors.transparent, AppColors.bgBase.withOpacity(0.8)],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Car info body ──────────────────────────────────────
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
                              Text(car.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                              if (car.brand.isNotEmpty || car.year != null)
                                Text(
                                  '${car.brand} ${car.model} ${car.year ?? ''}'.trim(),
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color:        car.isAvailable ? AppColors.successBg : AppColors.errorBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            car.isAvailable ? 'Available' : 'Unavailable',
                            style: TextStyle(
                              color:      car.isAvailable ? AppColors.success : AppColors.error,
                              fontSize:   12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Location
                    Row(children: [
                      const Icon(Icons.location_on_rounded, size: 15, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(car.location, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    const Divider(color: AppColors.border),
                    const SizedBox(height: 20),

                    // ── Specs row ───────────────────────────────────
                    const Text('Specifications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _SpecTile(icon: Icons.people_rounded,   label: 'Seats',        value: '${car.seats}'),
                        _SpecTile(icon: Icons.settings_rounded, label: 'Transmission', value: car.transmissionLabel),
                        _SpecTile(icon: Icons.local_gas_station_rounded, label: 'Fuel', value: car.fuelLabel),
                        if (car.color.isNotEmpty)
                          _SpecTile(icon: Icons.palette_rounded, label: 'Color', value: car.color),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Description ─────────────────────────────────
                    if (car.description.isNotEmpty) ...[
                      const Text('About', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text(car.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.6)),
                      const SizedBox(height: 20),
                    ],

                    // ── Features ────────────────────────────────────
                    if (car.features.isNotEmpty) ...[
                      const Text('Features', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: car.features.map((f) => _FeatureChip(label: f)).toList(),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // ── Map ─────────────────────────────────────────
                    if (car.locationLat != null && car.locationLng != null) ...[
                      const Text('Pickup Location', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: SizedBox(
                          height: 200,
                          child: FlutterMap(
                            options: MapOptions(
                              initialCenter: LatLng(car.locationLat!, car.locationLng!),
                              initialZoom:   14,
                              interactionOptions: const InteractionOptions(
                                flags: InteractiveFlag.none,
                              ),
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.sakyan.app',
                              ),
                              MarkerLayer(markers: [
                                Marker(
                                  point:  LatLng(car.locationLat!, car.locationLng!),
                                  width:  40, height: 40,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                    child: const Icon(Icons.directions_car_rounded, color: Colors.white, size: 20),
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

        // ── Sticky Book Now bottom bar ─────────────────────────────
        Positioned(
          left: 0, right: 0, bottom: 0,
          child: Container(
            padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).padding.bottom + 16),
            decoration: BoxDecoration(
              color:  AppColors.bgSurface,
              border: const Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '₱${car.pricePerDay.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary),
                    ),
                    const Text('per day', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      user == null ? 'Sign in to Book' : (car.isAvailable ? 'Book Now' : 'Unavailable'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
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

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor:      AppColors.bgSurface,
      highlightColor: AppColors.bgElevated,
      child: Column(children: [
        Container(height: 300, color: AppColors.bgSurface),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(children: [
            Container(height: 24, color: AppColors.bgSurface),
            const SizedBox(height: 8),
            Container(height: 16, width: 200, color: AppColors.bgSurface),
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
  const _SpecTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
        ]),
      ),
    );
  }
}

// ── Feature chip ──────────────────────────────────────────────────────────────
class _FeatureChip extends StatelessWidget {
  final String label;
  const _FeatureChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color:  AppColors.bgElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle_rounded, size: 12, color: AppColors.success),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ]),
    );
  }
}

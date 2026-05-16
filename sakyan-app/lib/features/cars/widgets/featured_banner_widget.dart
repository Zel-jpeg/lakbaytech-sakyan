import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/api_service.dart';
import '../providers/cars_provider.dart';

// ── Data model ────────────────────────────────────────────────────────────────
class _FeaturedData {
  final String? featuredPartnerName;
  final String? featuredPartnerLogoUrl;
  final String? featuredPartnerId;
  final String? mostCarsPartnerName;
  final String? mostCarsPartnerId;
  final int?    mostCarCount;
  final String? mostRentedPartnerName;
  final String? mostRentedPartnerId;
  final int?    mostRentedCount;
  final String? topCarName;
  final String? topCarImageUrl;
  final String? topCarId;
  final int?    topCarRentals;

  const _FeaturedData({
    this.featuredPartnerName,
    this.featuredPartnerLogoUrl,
    this.featuredPartnerId,
    this.mostCarsPartnerName,
    this.mostCarsPartnerId,
    this.mostCarCount,
    this.mostRentedPartnerName,
    this.mostRentedPartnerId,
    this.mostRentedCount,
    this.topCarName,
    this.topCarImageUrl,
    this.topCarId,
    this.topCarRentals,
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────
final _featuredDataProvider = FutureProvider<_FeaturedData>((ref) async {
  try {
    final res = await ApiService.get(ApiConstants.publicFeatured);
    final d   = res.data as Map<String, dynamic>? ?? {};

    String? _s(dynamic v) => v?.toString().isNotEmpty == true ? v.toString() : null;
    int?    _i(dynamic v) => v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');

    return _FeaturedData(
      featuredPartnerName:    _s(d['featured_partner']?['business_name'] ??
                                 d['featured_partner']?['contact_person']),
      featuredPartnerLogoUrl: _s(d['featured_partner']?['logo_url'] ??
                                 d['featured_partner']?['logo']),
      featuredPartnerId:      _s(d['featured_partner']?['id']),
      mostCarsPartnerName:    _s(d['most_cars_partner']?['business_name'] ??
                                 d['most_cars_partner']?['contact_person']),
      mostCarsPartnerId:      _s(d['most_cars_partner']?['id']),
      mostCarCount:           _i(d['most_cars_partner']?['car_count']),
      mostRentedPartnerName:  _s(d['most_rented_partner']?['business_name'] ??
                                 d['most_rented_partner']?['contact_person']),
      mostRentedPartnerId:    _s(d['most_rented_partner']?['id']),
      mostRentedCount:        _i(d['most_rented_partner']?['booking_count']),
      topCarName:             _s(d['top_rented_car']?['name']),
      topCarImageUrl:         _s(d['top_rented_car']?['primary_image_url'] ??
                                 d['top_rented_car']?['image_url']),
      topCarId:               _s(d['top_rented_car']?['id']),
      topCarRentals:          _i(d['top_rented_car']?['rental_count']),
    );
  } catch (_) {
    return const _FeaturedData();
  }
});

// ── Widget ────────────────────────────────────────────────────────────────────
class FeaturedBannerWidget extends ConsumerStatefulWidget {
  const FeaturedBannerWidget({super.key});

  @override
  ConsumerState<FeaturedBannerWidget> createState() =>
      _FeaturedBannerWidgetState();
}

class _FeaturedBannerWidgetState extends ConsumerState<FeaturedBannerWidget> {
  late final PageController _controller;
  Timer? _timer;
  int _page = 0;

  static const _autoAdvance = Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(_autoAdvance, (_) {
      if (!mounted) return;
      final total = 4; // number of slides
      final next  = (_page + 1) % total;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final featuredAsync = ref.watch(_featuredDataProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return featuredAsync.when(
      loading: () => _buildShimmer(isDark),
      error:   (_, __) => const SizedBox.shrink(),
      data:    (d) {
        // Build slide list — skip slides with no data
        final slides = <Widget>[
          if (d.featuredPartnerName != null)
            _FeaturedPartnerSlide(
              d: d, isDark: isDark,
              onTap: d.featuredPartnerId != null
                ? () {
                    ref.read(carFiltersProvider.notifier).update(
                      (f) => f.copyWith(partnerId: d.featuredPartnerId),
                    );
                  }
                : null,
            ),
          if (d.mostCarsPartnerName != null)
            _MostCarsPartnerSlide(d: d, isDark: isDark,
              onTap: d.mostCarsPartnerId != null
                ? () {
                    ref.read(carFiltersProvider.notifier).update(
                      (f) => f.copyWith(partnerId: d.mostCarsPartnerId),
                    );
                  }
                : null,
            ),
          if (d.mostRentedPartnerName != null)
            _MostRentedPartnerSlide(d: d, isDark: isDark,
              onTap: d.mostRentedPartnerId != null
                ? () {
                    ref.read(carFiltersProvider.notifier).update(
                      (f) => f.copyWith(partnerId: d.mostRentedPartnerId),
                    );
                  }
                : null,
            ),
          if (d.topCarName != null)
            _TopCarSlide(
              d:      d,
              isDark: isDark,
              onTap:  d.topCarId != null
                  ? () => context.push('/cars/${d.topCarId}')
                  : null,
            ),
        ];

        if (slides.isEmpty) return const SizedBox.shrink();

        // Reset page when slides count changes
        if (_page >= slides.length) _page = 0;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Column(
            children: [
              SizedBox(
                height: 160,
                child: PageView(
                  controller: _controller,
                  onPageChanged: (i) => setState(() => _page = i),
                  children: slides,
                ),
              ),
              const SizedBox(height: 8),
              // Dot indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(slides.length, (i) {
                  final sel = i == _page;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width:  sel ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: sel
                          ? AppColors.primary
                          : AppColors.primary.withOpacity(0.25),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildShimmer(bool isDark) {
    final shimBase = isDark ? AppColors.bgSurface  : AppColors.bgElevatedLight;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          color: shimBase,
          borderRadius: BorderRadius.circular(18),
        ),
      ),
    );
  }
}

// ── Slide: Featured Partner (paid boost) ──────────────────────────────────────
class _FeaturedPartnerSlide extends StatelessWidget {
  final _FeaturedData d;
  final bool isDark;
  final VoidCallback? onTap;
  const _FeaturedPartnerSlide({required this.d, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _ProfessionalBanner(
      isDark: isDark,
      gradientColors: isDark
          ? [const Color(0xFF0F2044), const Color(0xFF1A3A6A)]
          : [const Color(0xFF1A3A6A), const Color(0xFF2563EB)],
      badgeColor: const Color(0xFFFFB020),
      badgeLabel: '✦ FEATURED',
      accentColor: const Color(0xFFFFB020),
      onTap: onTap,
      title: d.featuredPartnerName!,
      subtitle: 'Featured Rental Partner',
      subInfo: 'Trusted by Sakyan users',
      ctaLabel: 'Browse Cars',
      logoUrl: d.featuredPartnerLogoUrl,
      carColor: const Color(0xFF4DA6FF),
    );
  }
}

// ── Slide: Most Cars Listed ───────────────────────────────────────────────────
class _MostCarsPartnerSlide extends StatelessWidget {
  final _FeaturedData d;
  final bool isDark;
  final VoidCallback? onTap;
  const _MostCarsPartnerSlide({required this.d, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _ProfessionalBanner(
      isDark: isDark,
      gradientColors: isDark
          ? [const Color(0xFF0A2A1A), const Color(0xFF0F4A2A)]
          : [const Color(0xFF0F5132), const Color(0xFF16A34A)],
      badgeColor: const Color(0xFF4ADE80),
      badgeLabel: '⬆ MOST CARS',
      accentColor: const Color(0xFF4ADE80),
      onTap: onTap,
      title: d.mostCarsPartnerName!,
      subtitle: 'Largest Fleet on Sakyan',
      subInfo: '${d.mostCarCount ?? 0} cars available',
      ctaLabel: 'Browse Cars',
      carColor: const Color(0xFF4ADE80),
    );
  }
}

// ── Slide: Most Rented Partner ────────────────────────────────────────────────
class _MostRentedPartnerSlide extends StatelessWidget {
  final _FeaturedData d;
  final bool isDark;
  final VoidCallback? onTap;
  const _MostRentedPartnerSlide({required this.d, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return _ProfessionalBanner(
      isDark: isDark,
      gradientColors: isDark
          ? [const Color(0xFF2A1500), const Color(0xFF4A2500)]
          : [const Color(0xFF92400E), const Color(0xFFD97706)],
      badgeColor: const Color(0xFFFBBF24),
      badgeLabel: '★ MOST RENTED',
      accentColor: const Color(0xFFFBBF24),
      onTap: onTap,
      title: d.mostRentedPartnerName!,
      subtitle: 'Top Rated Partner',
      subInfo: '${d.mostRentedCount ?? 0} successful bookings',
      ctaLabel: 'Browse Cars',
      carColor: const Color(0xFFFBBF24),
    );
  }
}

// ── Reusable professional banner with car on right ────────────────────────────
class _ProfessionalBanner extends StatelessWidget {
  final bool isDark;
  final List<Color> gradientColors;
  final Color badgeColor;
  final String badgeLabel;
  final Color accentColor;
  final VoidCallback? onTap;
  final String title;
  final String subtitle;
  final String subInfo;
  final String ctaLabel;
  final String? logoUrl;
  final Color carColor;

  const _ProfessionalBanner({
    required this.isDark,
    required this.gradientColors,
    required this.badgeColor,
    required this.badgeLabel,
    required this.accentColor,
    required this.title,
    required this.subtitle,
    required this.subInfo,
    required this.ctaLabel,
    required this.carColor,
    this.onTap,
    this.logoUrl,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: gradientColors.last.withOpacity(0.35),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // ── Subtle background pattern ──
            Positioned(
              top: -20, right: -20,
              child: Container(
                width: 140, height: 140,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: -30, right: 60,
              child: Container(
                width: 100, height: 100,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  shape: BoxShape.circle,
                ),
              ),
            ),

            // ── Main content ──
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 0, 14),
              child: Row(
                children: [
                  // Left: text content
                  Expanded(
                    flex: 7,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Badge pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: badgeColor.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: badgeColor.withOpacity(0.55),
                                width: 1),
                          ),
                          child: Text(
                            badgeLabel,
                            style: TextStyle(
                              color: badgeColor,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 7),

                        // Company name
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                            letterSpacing: -0.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),

                        // Subtitle
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.72),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),

                        // Sub-info with accent
                        Row(
                          children: [
                            Icon(Icons.star_rounded,
                                size: 11, color: accentColor),
                            const SizedBox(width: 4),
                            Text(
                              subInfo,
                              style: TextStyle(
                                color: accentColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // CTA Button
                        if (onTap != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  ctaLabel,
                                  style: TextStyle(
                                    color: gradientColors.last,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded,
                                    size: 11, color: gradientColors.last),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Right: car illustration
                  SizedBox(
                    width: 110,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Glow behind car
                        Positioned(
                          bottom: 8,
                          child: Container(
                            width: 90, height: 20,
                            decoration: BoxDecoration(
                              color: carColor.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(40),
                            ),
                          ),
                        ),
                        // Car icon
                        _CarIllustration(color: carColor),
                        // Logo overlay (if available)
                        if (logoUrl != null)
                          Positioned(
                            top: 0, right: 4,
                            child: Container(
                              width: 30, height: 30,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.15),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: CachedNetworkImage(
                                  imageUrl: logoUrl!,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => const Icon(
                                      Icons.store_rounded,
                                      size: 14,
                                      color: AppColors.primary),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
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

// ── Car illustration using Flutter icons ──────────────────────────────────────
class _CarIllustration extends StatelessWidget {
  final Color color;
  const _CarIllustration({required this.color});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Body shadow
        Positioned(
          bottom: 12,
          child: Container(
            width: 80, height: 30,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(60),
            ),
          ),
        ),
        // Car icon — large
        Icon(
          Icons.directions_car_rounded,
          size: 72,
          color: color.withOpacity(0.9),
        ),
        // Shine on car
        Positioned(
          top: 10, left: 20,
          child: Container(
            width: 18, height: 5,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.25),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Slide: Top Rented Car ─────────────────────────────────────────────────────
class _TopCarSlide extends StatelessWidget {
  final _FeaturedData d;
  final bool isDark;
  final VoidCallback? onTap;
  const _TopCarSlide({required this.d, required this.isDark, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.bgSurface : AppColors.bgSurfaceLight,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.3 : 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background car image
            if (d.topCarImageUrl != null)
              CachedNetworkImage(
                imageUrl: d.topCarImageUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                    color: isDark
                        ? AppColors.bgElevated
                        : AppColors.bgElevatedLight),
              ),
            // Multi-stop gradient overlay for readability
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xCC000000)],
                  stops: [0.25, 1.0],
                ),
              ),
            ),
            // Top-left gradient for badge area
            Positioned(
              top: 0, left: 0, right: 0,
              height: 60,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.45),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // Badge
            Positioned(
              top: 12, left: 14,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.local_fire_department_rounded,
                        size: 11, color: Colors.white),
                    SizedBox(width: 4),
                    Text(
                      'TOP CAR',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom info
            Positioned(
              bottom: 14, left: 14, right: 14,
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          d.topCarName!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (d.topCarRentals != null)
                          Row(
                            children: [
                              const Icon(Icons.people_rounded,
                                  size: 11, color: Colors.white60),
                              const SizedBox(width: 4),
                              Text(
                                '${d.topCarRentals} rentals this month',
                                style: const TextStyle(
                                  color: Colors.white60,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  if (onTap != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Text(
                        'View Car',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
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

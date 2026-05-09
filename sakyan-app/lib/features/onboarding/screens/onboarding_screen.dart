import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/services/storage_service.dart';

// ── Slide data ────────────────────────────────────────────────────────────────
class _SlideData {
  final String title;
  final String subtitle;
  final Color accentColor;
  final Color bgFrom;
  final Color bgTo;
  final int index;

  const _SlideData({
    required this.title,
    required this.subtitle,
    required this.accentColor,
    required this.bgFrom,
    required this.bgTo,
    required this.index,
  });
}

const _slides = [
  _SlideData(
    title:       'Find Your\nPerfect Ride',
    subtitle:    'Browse hundreds of verified cars near you — from city sedans to rugged SUVs for every journey.',
    accentColor: Color(0xFF2563EB),
    bgFrom:      Color(0xFF1E3A8A),
    bgTo:        Color(0xFF0F172A),
    index:       0,
  ),
  _SlideData(
    title:       'Book\nin Minutes',
    subtitle:    'Pick your dates, choose pickup or delivery, and confirm instantly. No hassle, just drive.',
    accentColor: Color(0xFF0891B2),
    bgFrom:      Color(0xFF164E63),
    bgTo:        Color(0xFF0F172A),
    index:       1,
  ),
  _SlideData(
    title:       'Earn With\nYour Car',
    subtitle:    'List your vehicle as a partner and start earning extra income. Join hundreds of successful partners.',
    accentColor: Color(0xFF7C3AED),
    bgFrom:      Color(0xFF3B0764),
    bgTo:        Color(0xFF0F172A),
    index:       2,
  ),
];

// ── OnboardingScreen ──────────────────────────────────────────────────────────
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final _pageCtrl = PageController();
  int _currentPage = 0;

  // Text/content reveal animation
  late AnimationController _revealCtrl;
  late Animation<double>   _fadeAnim;
  late Animation<Offset>   _slideAnim;

  // Illustration bounce animation
  late AnimationController _bounceCtrl;
  late Animation<double>   _bounceAnim;

  @override
  void initState() {
    super.initState();

    _revealCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 480),
    );
    _fadeAnim = CurvedAnimation(
      parent: _revealCtrl,
      curve:  Curves.easeOut,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.18),
      end:   Offset.zero,
    ).animate(CurvedAnimation(parent: _revealCtrl, curve: Curves.easeOut));

    _bounceCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 700),
    );
    _bounceAnim = CurvedAnimation(
      parent: _bounceCtrl,
      curve:  Curves.elasticOut,
    );

    _revealCtrl.forward();
    _bounceCtrl.forward();
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _revealCtrl.reset();
    _bounceCtrl.reset();
    _revealCtrl.forward();
    _bounceCtrl.forward();
  }

  void _next() {
    if (_currentPage < _slides.length - 1) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 420),
        curve:    Curves.easeInOut,
      );
    } else {
      _finish();
    }
  }

  Future<void> _finish() async {
    await StorageService.setSeenOnboarding();
    if (mounted) context.go(AppRoutes.login);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _revealCtrl.dispose();
    _bounceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size   = MediaQuery.of(context).size;
    final isLast = _currentPage == _slides.length - 1;
    final slide  = _slides[_currentPage];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Content-area background — adaptive to current theme
    final contentBg = isDark ? AppColors.bgBase : const Color(0xFFF8FAFF);
    // Inactive dot color — visible on both light and dark
    final dotInactive = isDark
        ? Colors.white.withOpacity(0.25)
        : Colors.black.withOpacity(0.18);

    return Scaffold(
      backgroundColor: contentBg,
      body: Stack(
        children: [
          // ── Full-screen page view ────────────────────────────────────────
          PageView.builder(
            controller:    _pageCtrl,
            onPageChanged: _onPageChanged,
            itemCount:     _slides.length,
            physics:       const BouncingScrollPhysics(),
            itemBuilder:   (_, i) => _SlidePage(
              slide:      _slides[i],
              fadeAnim:   i == _currentPage ? _fadeAnim   : const AlwaysStoppedAnimation(1.0),
              slideAnim:  i == _currentPage ? _slideAnim  : const AlwaysStoppedAnimation(Offset.zero),
              bounceAnim: i == _currentPage ? _bounceAnim : const AlwaysStoppedAnimation(1.0),
              isDark:     isDark,
              contentBg:  contentBg,
            ),
          ),

          // ── Skip button ──────────────────────────────────────────────────
          Positioned(
            top:   MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: AnimatedOpacity(
              opacity:  isLast ? 0 : 1,
              duration: const Duration(milliseconds: 250),
              child: TextButton(
                onPressed: isLast ? null : _finish,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white.withOpacity(0.6),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                ),
                child: const Text(
                  'Skip',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ),
            ),
          ),

          // ── Bottom controls ──────────────────────────────────────────────
          Positioned(
            left:   24,
            right:  24,
            bottom: MediaQuery.of(context).padding.bottom + 28,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Pill dot indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_slides.length, (i) {
                    final active = i == _currentPage;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 320),
                      curve:    Curves.easeInOut,
                      margin:   const EdgeInsets.symmetric(horizontal: 4),
                      width:    active ? 32 : 8,
                      height:   8,
                      decoration: BoxDecoration(
                        color: active
                            ? slide.accentColor
                            : dotInactive,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 28),

                // ── Next / Get Started ─────────────────────────────────────
                SizedBox(
                  width:  double.infinity,
                  height: 56,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      color:        slide.accentColor,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color:       slide.accentColor.withOpacity(0.35),
                          blurRadius:  20,
                          offset:      const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Material(
                      color:        Colors.transparent,
                      borderRadius: BorderRadius.circular(18),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap:        _next,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              isLast ? 'Get Started' : 'Next',
                              style: const TextStyle(
                                color:      Colors.white,
                                fontSize:   16,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.2,
                              ),
                            ),
                            if (!isLast) ...[
                              const SizedBox(width: 8),
                              const Icon(Icons.arrow_forward_rounded,
                                  color: Colors.white, size: 18),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Single slide page ─────────────────────────────────────────────────────────
class _SlidePage extends StatelessWidget {
  final _SlideData        slide;
  final Animation<double> fadeAnim;
  final Animation<Offset> slideAnim;
  final Animation<double> bounceAnim;
  final bool              isDark;
  final Color             contentBg;

  const _SlidePage({
    required this.slide,
    required this.fadeAnim,
    required this.slideAnim,
    required this.bounceAnim,
    required this.isDark,
    required this.contentBg,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Text colors adapt to theme
    final titleColor    = isDark ? AppColors.textPrimary    : const Color(0xFF111827);
    final subtitleColor = isDark ? AppColors.textSecondary  : const Color(0xFF6B7280);

    return Column(
      children: [
        // ── Illustration area (top ~57%) ─────────────────────────────────
        SizedBox(
          height: size.height * 0.57,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Gradient background
              CustomPaint(
                painter: _GradientBgPainter(
                  fromColor: slide.bgFrom,
                  toColor:   slide.bgTo,
                ),
              ),

              // Illustration with bounce-in
              Center(
                child: ScaleTransition(
                  scale: bounceAnim,
                  child: _Illustration(slide: slide),
                ),
              ),

              // Bottom curve into content area
              Align(
                alignment: Alignment.bottomCenter,
                child: CustomPaint(
                  size: Size(size.width, 48),
                  painter: _BottomCurvePainter(color: contentBg),
                ),
              ),
            ],
          ),
        ),

        // ── Text content (bottom ~43%) ───────────────────────────────────
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 24, 28, 0),
            child: SlideTransition(
              position: slideAnim,
              child: FadeTransition(
                opacity: fadeAnim,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Accent tag line
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: slide.accentColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color: slide.accentColor.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _tagIcon(slide.index),
                            color: slide.accentColor,
                            size:  12,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            _tagLabel(slide.index),
                            style: TextStyle(
                              color:      slide.accentColor,
                              fontSize:   11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Main title
                    Text(
                      slide.title,
                      style: TextStyle(
                        color:       titleColor,
                        fontSize:    30,
                        fontWeight:  FontWeight.w800,
                        height:      1.12,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Subtitle
                    Text(
                      slide.subtitle,
                      style: TextStyle(
                        color:    subtitleColor,
                        fontSize: 14,
                        height:   1.65,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  IconData _tagIcon(int index) {
    switch (index) {
      case 0:  return Icons.search_rounded;
      case 1:  return Icons.bolt_rounded;
      default: return Icons.trending_up_rounded;
    }
  }

  String _tagLabel(int index) {
    switch (index) {
      case 0:  return 'DISCOVER';
      case 1:  return 'FAST BOOKING';
      default: return 'EARN INCOME';
    }
  }
}

// ── Illustration widget — one per slide ───────────────────────────────────────
class _Illustration extends StatelessWidget {
  final _SlideData slide;
  const _Illustration({required this.slide});

  @override
  Widget build(BuildContext context) {
    return switch (slide.index) {
      0 => _FindRideIllustration(accent: slide.accentColor),
      1 => _BookingIllustration(accent: slide.accentColor),
      2 => _EarnIllustration(accent: slide.accentColor),
      _ => const SizedBox.shrink(),
    };
  }
}

// ── Slide 1 — Find Your Ride ──────────────────────────────────────────────────
class _FindRideIllustration extends StatelessWidget {
  final Color accent;
  const _FindRideIllustration({required this.accent});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width:  300,
      height: 280,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer glow ring
          Container(
            width:  240,
            height: 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                  color: Colors.white.withOpacity(0.07), width: 1),
              gradient: RadialGradient(
                colors: [
                  accent.withOpacity(0.18),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // Inner circle
          Container(
            width:  160,
            height: 160,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.07),
              border: Border.all(
                  color: Colors.white.withOpacity(0.12), width: 1),
            ),
          ),
          // Main icon
          Container(
            width:  96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accent.withOpacity(0.2),
            ),
            child: Icon(
              Icons.directions_car_filled_rounded,
              size:  52,
              color: Colors.white,
            ),
          ),

          // ── Floating UI chips ────────────────────────────────────────────
          Positioned(
            top:   22,
            right: 8,
            child: _FloatingChip(
              icon:  Icons.location_on_rounded,
              label: 'Quezon City',
              color: accent,
            ),
          ),
          Positioned(
            bottom: 22,
            left:   4,
            child: _FloatingChip(
              icon:  Icons.search_rounded,
              label: '200+ Cars',
              color: accent,
            ),
          ),
          Positioned(
            top:  68,
            left: 8,
            child: _FloatingBadge(
              icon:  Icons.star_rounded,
              value: '4.9',
              color: AppColors.warning,
            ),
          ),
          Positioned(
            bottom: 62,
            right:  12,
            child: _FloatingBadge(
              icon:  Icons.verified_rounded,
              value: 'Verified',
              color: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Slide 2 — Book in Minutes ─────────────────────────────────────────────────
class _BookingIllustration extends StatelessWidget {
  final Color accent;
  const _BookingIllustration({required this.accent});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width:  300,
      height: 280,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer ring
          Container(
            width:  240,
            height: 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                  color: Colors.white.withOpacity(0.07), width: 1),
              gradient: RadialGradient(
                colors: [
                  accent.withOpacity(0.18),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          Container(
            width:  160,
            height: 160,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.07),
              border: Border.all(
                  color: Colors.white.withOpacity(0.12), width: 1),
            ),
          ),
          // Main icon — calendar
          Container(
            width:  96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accent.withOpacity(0.2),
            ),
            child: const Icon(
              Icons.calendar_today_rounded,
              size:  50,
              color: Colors.white,
            ),
          ),

          // Floating chips
          Positioned(
            top:   20,
            right: 8,
            child: _FloatingChip(
              icon:  Icons.check_circle_rounded,
              label: 'Confirmed',
              color: AppColors.success,
            ),
          ),
          Positioned(
            bottom: 22,
            left:   4,
            child: _FloatingChip(
              icon:  Icons.access_time_rounded,
              label: '3-Day Trip',
              color: accent,
            ),
          ),
          Positioned(
            top:  68,
            left: 10,
            child: _FloatingBadge(
              icon:  Icons.bolt_rounded,
              value: 'Instant',
              color: AppColors.warning,
            ),
          ),
          Positioned(
            bottom: 64,
            right:  10,
            child: _CalendarMini(accent: accent),
          ),
        ],
      ),
    );
  }
}

/// Mini calendar decoration widget
class _CalendarMini extends StatelessWidget {
  final Color accent;
  const _CalendarMini({required this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color:        AppColors.bgSurface,
        borderRadius: BorderRadius.circular(10),
        border:       Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.25),
              blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          final selected = i == 1;
          return Container(
            width:  22,
            height: 22,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color:        selected ? accent : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Center(
              child: Text(
                '${12 + i}',
                style: TextStyle(
                  color:      selected ? Colors.white : AppColors.textMuted,
                  fontSize:   10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ── Slide 3 — Earn with Car ───────────────────────────────────────────────────
class _EarnIllustration extends StatelessWidget {
  final Color accent;
  const _EarnIllustration({required this.accent});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width:  300,
      height: 280,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer ring
          Container(
            width:  240,
            height: 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                  color: Colors.white.withOpacity(0.07), width: 1),
              gradient: RadialGradient(
                colors: [
                  accent.withOpacity(0.18),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          Container(
            width:  160,
            height: 160,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.07),
              border: Border.all(
                  color: Colors.white.withOpacity(0.12), width: 1),
            ),
          ),
          // Main icon — car with money
          Container(
            width:  96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accent.withOpacity(0.2),
            ),
            child: const Icon(
              Icons.monetization_on_rounded,
              size:  52,
              color: Colors.white,
            ),
          ),

          Positioned(
            top:   20,
            right: 8,
            child: _FloatingChip(
              icon:  Icons.trending_up_rounded,
              label: '+₱12,500',
              color: AppColors.success,
            ),
          ),
          Positioned(
            bottom: 22,
            left:   4,
            child: _FloatingChip(
              icon:  Icons.people_rounded,
              label: '500+ Partners',
              color: accent,
            ),
          ),
          Positioned(
            top:  68,
            left: 8,
            child: _FloatingBadge(
              icon:  Icons.workspace_premium_rounded,
              value: 'Partner',
              color: AppColors.warning,
            ),
          ),
          Positioned(
            bottom: 62,
            right:  8,
            child: _MiniChart(accent: accent),
          ),
        ],
      ),
    );
  }
}

/// Mini bar chart decoration widget
class _MiniChart extends StatelessWidget {
  final Color accent;
  const _MiniChart({required this.accent});

  static const _heights = [0.4, 0.6, 0.5, 0.8, 1.0];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color:        AppColors.bgSurface,
        borderRadius: BorderRadius.circular(10),
        border:       Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.25),
              blurRadius: 10),
        ],
      ),
      child: Row(
        mainAxisSize:     MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: _heights.map((h) {
          return Container(
            width:  6,
            height: 28 * h,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color:        h == 1.0
                  ? accent
                  : accent.withOpacity(0.35),
              borderRadius: BorderRadius.circular(3),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Shared floating UI elements ───────────────────────────────────────────────

class _FloatingChip extends StatelessWidget {
  final IconData icon;
  final String   label;
  final Color    color;

  const _FloatingChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color:        AppColors.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border:       Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color:      Colors.black.withOpacity(0.3),
            blurRadius: 14,
            offset:     const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color:      AppColors.textPrimary,
              fontSize:   11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _FloatingBadge extends StatelessWidget {
  final IconData icon;
  final String   value;
  final Color    color;

  const _FloatingBadge({
    required this.icon,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color:        color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
        border:       Border.all(color: color.withOpacity(0.35)),
        boxShadow: [
          BoxShadow(
            color:      Colors.black.withOpacity(0.2),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 3),
          Text(
            value,
            style: TextStyle(
              color:      color,
              fontSize:   10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Custom painters ───────────────────────────────────────────────────────────

/// Gradient background + decorative circles for the illustration area.
class _GradientBgPainter extends CustomPainter {
  final Color fromColor;
  final Color toColor;

  const _GradientBgPainter({required this.fromColor, required this.toColor});

  @override
  void paint(Canvas canvas, Size size) {
    // Main gradient
    final bgPaint = Paint()
      ..shader = LinearGradient(
        begin:  Alignment.topLeft,
        end:    Alignment.bottomRight,
        colors: [fromColor, toColor],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Decorative translucent circles
    final dotPaint = Paint()..color = Colors.white.withOpacity(0.04);
    canvas.drawCircle(
        Offset(size.width * 0.85, size.height * 0.12), 90, dotPaint);
    canvas.drawCircle(
        Offset(size.width * 0.08, size.height * 0.75), 70, dotPaint);
    canvas.drawCircle(
        Offset(size.width * 0.5,  size.height * 0.05), 40, dotPaint);
  }

  @override
  bool shouldRepaint(_GradientBgPainter old) =>
      old.fromColor != fromColor || old.toColor != toColor;
}

/// Draws a smooth curve that transitions the illustration area into the
/// content area below — color adapts to current theme.
class _BottomCurvePainter extends CustomPainter {
  final Color color;
  const _BottomCurvePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height)
      ..lineTo(0, size.height * 0.55)
      ..quadraticBezierTo(
        size.width * 0.5,
        -size.height * 0.15,
        size.width,
        size.height * 0.55,
      )
      ..lineTo(size.width, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_BottomCurvePainter old) => old.color != color;
}
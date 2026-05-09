import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/services/storage_service.dart';

/// Sakyan animated splash screen.
///
/// The Android window background (#080D1A set in styles.xml) eliminates any
/// black flash before Flutter starts — the user sees the same dark colour
/// from the moment they tap the icon. This screen then paints on top of that
/// seamlessly with its animations.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  static const _displayMs = 2400;

  // Logo scale-in + fade
  late final AnimationController _logoCtrl;
  late final Animation<double>   _logoScale;
  late final Animation<double>   _logoFade;

  // Pulse ring
  late final AnimationController _pulseCtrl;
  late final Animation<double>   _pulseScale;
  late final Animation<double>   _pulseOpacity;

  // Wordmark slide-up + fade
  late final AnimationController _wordCtrl;
  late final Animation<double>   _wordFade;
  late final Animation<Offset>   _wordSlide;

  // Tagline fade
  late final AnimationController _tagCtrl;
  late final Animation<double>   _tagFade;

  @override
  void initState() {
    super.initState();

    // Keep status bar icons light against the dark bg
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor:           Colors.transparent,
      statusBarIconBrightness:  Brightness.light,
      systemNavigationBarColor: Color(0xFF080D1A),
    ));

    // Logo: scale 0.6 → 1.0 with bounce, fade 0 → 1  (650ms)
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
    _logoScale = Tween<double>(begin: 0.60, end: 1.0).animate(
      CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOutBack),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoCtrl, curve: Curves.easeIn),
    );

    // Pulse ring: expand + fade, loops (1600ms)
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );
    _pulseScale = Tween<double>(begin: 0.88, end: 1.62).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut),
    );
    _pulseOpacity = Tween<double>(begin: 0.55, end: 0.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut),
    );

    // Wordmark: slide up + fade (480ms, starts after logo finishes)
    _wordCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 480),
    );
    _wordFade = CurvedAnimation(parent: _wordCtrl, curve: Curves.easeOut);
    _wordSlide = Tween<Offset>(
      begin: const Offset(0, 0.45),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _wordCtrl, curve: Curves.easeOut));

    // Tagline fades in 120ms after wordmark
    _tagCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
    _tagFade = CurvedAnimation(parent: _tagCtrl, curve: Curves.easeIn);

    // Kick off sequence
    _logoCtrl.forward().then((_) {
      _pulseCtrl.repeat();
      _wordCtrl.forward().then((_) {
        Future.delayed(const Duration(milliseconds: 120), () {
          if (mounted) _tagCtrl.forward();
        });
      });
    });

    // Navigate away when display time is up
    Future.delayed(const Duration(milliseconds: _displayMs), _navigate);
  }

  void _navigate() {
    if (!mounted) return;
    if (!StorageService.hasSeenOnboarding()) {
      context.go(AppRoutes.onboarding);
    } else if (!StorageService.hasToken()) {
      context.go(AppRoutes.login);
    } else {
      context.go(AppRoutes.home);
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _pulseCtrl.dispose();
    _wordCtrl.dispose();
    _tagCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF080D1A);

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [

          // ── Background glow — top centre ───────────────────────────────
          Positioned(
            top: -80,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 500,
                height: 500,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.14),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Accent glow — bottom right ─────────────────────────────────
          Positioned(
            bottom: -80,
            right: -60,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withOpacity(0.07),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Dot grid — top right ───────────────────────────────────────
          Positioned(
            top: 72,
            right: 24,
            child: _DotsGrid(
              color: Colors.white.withOpacity(0.045),
              columns: 6,
              rows: 6,
            ),
          ),

          // ── Dot grid — bottom left ─────────────────────────────────────
          Positioned(
            bottom: 120,
            left: 20,
            child: _DotsGrid(
              color: Colors.white.withOpacity(0.03),
              columns: 4,
              rows: 4,
            ),
          ),

          // ── Centre content ─────────────────────────────────────────────
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                // ── Logo mark ────────────────────────────────────────────
                SizedBox(
                  width: 160,
                  height: 160,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [

                      // Static soft glow behind circle
                      FadeTransition(
                        opacity: _logoFade,
                        child: Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                AppColors.primary.withOpacity(0.20),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Animated expanding pulse ring
                      AnimatedBuilder(
                        animation: _pulseCtrl,
                        builder: (_, __) => Transform.scale(
                          scale: _pulseScale.value,
                          child: Opacity(
                            opacity: _pulseOpacity.value,
                            child: Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.primary,
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Logo circle
                      ScaleTransition(
                        scale: _logoScale,
                        child: FadeTransition(
                          opacity: _logoFade,
                          child: Container(
                            width: 108,
                            height: 108,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFF1A2540),
                                  Color(0xFF0A1020),
                                ],
                              ),
                              border: Border.all(
                                color: AppColors.primary.withOpacity(0.50),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.38),
                                  blurRadius: 40,
                                  spreadRadius: 6,
                                ),
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.55),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Padding(
                                padding: const EdgeInsets.all(18),
                                child: Image.asset(
                                  'assets/icon.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) =>
                                      const _FallbackIcon(),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 36),

                // ── Wordmark with gradient text ───────────────────────────
                SlideTransition(
                  position: _wordSlide,
                  child: FadeTransition(
                    opacity: _wordFade,
                    child: ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Color(0xFFFFFFFF), Color(0xFFBFC8DC)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ).createShader(bounds),
                      child: const Text(
                        'Sakyan',
                        style: TextStyle(
                          fontSize: 42,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -1.4,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // ── Tagline with decorative lines ─────────────────────────
                FadeTransition(
                  opacity: _tagFade,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 20,
                        height: 1,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              AppColors.primary.withOpacity(0.6),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Your trusted car rental platform',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                          color: AppColors.textSecondary,
                          letterSpacing: 0.3,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        width: 20,
                        height: 1,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.primary.withOpacity(0.6),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom: version + progress bar ─────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(44, 0, 44, 38),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FadeTransition(
                      opacity: _tagFade,
                      child: Text(
                        'v1.0.0',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted.withOpacity(0.55),
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: _ProgressBar(
                        durationMs: _displayMs,
                        color:   AppColors.primary,
                        bgColor: AppColors.primary.withOpacity(0.12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

        ],
      ),
    );
  }
}

// ── Smooth determinate progress bar ──────────────────────────────────────────
class _ProgressBar extends StatefulWidget {
  final int   durationMs;
  final Color color;
  final Color bgColor;
  const _ProgressBar({
    required this.durationMs,
    required this.color,
    required this.bgColor,
  });

  @override
  State<_ProgressBar> createState() => _ProgressBarState();
}

class _ProgressBarState extends State<_ProgressBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: widget.durationMs),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => LinearProgressIndicator(
        value:           _ctrl.value,
        minHeight:       2,
        backgroundColor: widget.bgColor,
        color:           widget.color,
      ),
    );
  }
}

// ── Decorative dot grid ───────────────────────────────────────────────────────
class _DotsGrid extends StatelessWidget {
  final Color color;
  final int   columns;
  final int   rows;
  const _DotsGrid({
    required this.color,
    required this.columns,
    required this.rows,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        rows,
        (_) => Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            columns,
            (_) => Container(
              width: 3,
              height: 3,
              margin: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                  color: color, shape: BoxShape.circle),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Fallback when assets/icon.png is missing ──────────────────────────────────
class _FallbackIcon extends StatelessWidget {
  const _FallbackIcon();
  @override
  Widget build(BuildContext context) {
    return const Icon(
      Icons.directions_car_filled_rounded,
      color: Colors.white,
      size: 48,
    );
  }
}
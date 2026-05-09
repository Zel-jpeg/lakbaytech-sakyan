import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/services/storage_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _currentPage = 0;

  static const _slides = [
    _Slide(
      emoji: '🚗',
      title: 'Find Your\nPerfect Ride',
      subtitle: 'Browse hundreds of verified cars near you and book in seconds.',
      gradientStart: Color(0xFF0A0F1E),
      gradientEnd:   Color(0xFF1a1040),
    ),
    _Slide(
      emoji: '📅',
      title: 'Book\nin Minutes',
      subtitle: 'Pick your dates, choose pickup or delivery, and confirm instantly.',
      gradientStart: Color(0xFF0A0F1E),
      gradientEnd:   Color(0xFF0f2030),
    ),
    _Slide(
      emoji: '💰',
      title: 'Earn With\nYour Car',
      subtitle: 'List your vehicle as a partner and start earning extra income today.',
      gradientStart: Color(0xFF0A0F1E),
      gradientEnd:   Color(0xFF1a0f0a),
    ),
  ];

  void _next() {
    if (_currentPage < _slides.length - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
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
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slide       = _slides[_currentPage];
    final isLast      = _currentPage == _slides.length - 1;

    return Scaffold(
      body: Stack(
        children: [
          // ── Gradient background ──────────────────────────────────────
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end:   Alignment.bottomCenter,
                colors: [slide.gradientStart, slide.gradientEnd],
              ),
            ),
          ),

          // ── Page content ─────────────────────────────────────────────
          PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemCount: _slides.length,
            itemBuilder: (_, i) => _SlideWidget(slide: _slides[i]),
          ),

          // ── Skip button ──────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            right: 20,
            child: TextButton(
              onPressed: _finish,
              child: const Text(
                'Skip',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ),
          ),

          // ── Bottom controls ───────────────────────────────────────────
          Positioned(
            left: 24,
            right: 24,
            bottom: MediaQuery.of(context).padding.bottom + 32,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Dot indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_slides.length, (i) {
                    final active = i == _currentPage;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width:  active ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color:        active ? AppColors.primary : AppColors.textMuted,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 32),

                // CTA button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _next,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      isLast ? 'Get Started' : 'Next',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
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

// ── Slide data model ─────────────────────────────────────────────────────────
class _Slide {
  final String emoji;
  final String title;
  final String subtitle;
  final Color gradientStart;
  final Color gradientEnd;
  const _Slide({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.gradientStart,
    required this.gradientEnd,
  });
}

// ── Individual slide widget ──────────────────────────────────────────────────
class _SlideWidget extends StatelessWidget {
  final _Slide slide;
  const _SlideWidget({required this.slide});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Emoji in glowing circle
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.bgElevated,
              boxShadow: [
                BoxShadow(
                  color:       AppColors.primaryGlow,
                  blurRadius:  40,
                  spreadRadius: 10,
                ),
              ],
              border: Border.all(color: AppColors.border, width: 1),
            ),
            child: Center(
              child: Text(slide.emoji, style: const TextStyle(fontSize: 56)),
            ),
          ),
          const SizedBox(height: 48),

          // Title
          Text(
            slide.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color:      AppColors.textPrimary,
              fontSize:   32,
              fontWeight: FontWeight.w700,
              height:     1.2,
            ),
          ),
          const SizedBox(height: 16),

          // Subtitle
          Text(
            slide.subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color:    AppColors.textSecondary,
              fontSize: 16,
              height:   1.6,
            ),
          ),
        ],
      ),
    );
  }
}

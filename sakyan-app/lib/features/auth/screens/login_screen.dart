import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/theme/theme_provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  bool _loading = false;

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();

    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
    _fadeAnim =
        CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.07),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _loading = true);
    try {
      await ref.read(authNotifierProvider.notifier).signInWithGoogle();
      
      if (!mounted) return;
      
      final user = ref.read(currentUserProvider);
      if (user != null) {
        if (user.isPartner == true) {
          context.go(AppRoutes.partnerHome);
        } else {
          context.go(AppRoutes.home);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sign-in failed: ${e.toString()}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(isDarkModeProvider);

    final bgColor =
        isDark ? const Color(0xFF080D1A) : const Color(0xFFF8FAFF);
    final borderColor =
        isDark ? const Color(0xFF1F2937) : const Color(0xFFE5E7EB);
    final textPrimary =
        isDark ? const Color(0xFFF3F4F6) : const Color(0xFF111827);
    final textSecondary =
        isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);
    final textMuted =
        isDark ? const Color(0xFF4B5563) : const Color(0xFF9CA3AF);
    final glowColor =
        AppColors.primary.withOpacity(isDark ? 0.18 : 0.10);
    final badgeBg =
        isDark ? const Color(0xFF1F2937) : const Color(0xFFF3F4F6);
    final dotColor = isDark
        ? Colors.white.withOpacity(0.06)
        : Colors.black.withOpacity(0.04);

    final toggleIcon =
        isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded;
    final toggleBg = isDark
        ? Colors.white.withOpacity(0.08)
        : Colors.black.withOpacity(0.06);

    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          // ── Radial glows ───────────────────────────────────────────────
          Positioned(
            top: -100,
            left: size.width / 2 - 180,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                    colors: [glowColor, Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            bottom: size.height * 0.22,
            right: -80,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary
                        .withOpacity(isDark ? 0.07 : 0.05),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Dot grids ──────────────────────────────────────────────────
          Positioned(
            top: 56,
            right: 18,
            child: _DotsGrid(dotColor: dotColor, columns: 5, rows: 5),
          ),
          Positioned(
            bottom: 110,
            left: 14,
            child: _DotsGrid(dotColor: dotColor, columns: 4, rows: 4),
          ),

          // ── Theme toggle ───────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () =>
                    ref.read(themeModeProvider.notifier).toggle(),
                child: Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: toggleBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: borderColor),
                  ),
                  child: Icon(toggleIcon,
                      size: 20, color: textSecondary),
                ),
              ),
            ),
          ),

          // ── Main content ───────────────────────────────────────────────
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Spacer(flex: 2),

                      // ── Logo + app name ──────────────────────────────
                      Center(
                        child: Column(
                          children: [
                            _SakyanLogo(isDark: isDark),
                            const SizedBox(height: 20),
                            Text(
                              'Sakyan',
                              style: TextStyle(
                                color: textPrimary,
                                fontSize: 40,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -1.2,
                                fontFamily: 'PlusJakartaSans',
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Your trusted car rental platform',
                              style: TextStyle(
                                color: textSecondary,
                                fontSize: 14,
                                fontFamily: 'PlusJakartaSans',
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(flex: 2),

                      // ── Headline ─────────────────────────────────────
                      Text(
                        'Welcome back 👋',
                        style: TextStyle(
                          color: textPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.4,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Sign in to book cars, track your trips,\nand manage your rentals.',
                        style: TextStyle(
                          color: textSecondary,
                          fontSize: 14,
                          height: 1.6,
                          fontFamily: 'PlusJakartaSans',
                        ),
                      ),
                      const SizedBox(height: 28),

                      // ── Google Sign-In button ─────────────────────────
                      _GoogleSignInButton(
                        loading: _loading,
                        isDark: isDark,
                        onTap: _signInWithGoogle,
                      ),
                      const SizedBox(height: 20),

                      // ── Divider ───────────────────────────────────────
                      Row(children: [
                        Expanded(
                            child: Divider(
                                color: borderColor, thickness: 1)),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14),
                          child: Text(
                            'Secure OAuth 2.0',
                            style: TextStyle(
                              color: textMuted,
                              fontSize: 11,
                              fontFamily: 'PlusJakartaSans',
                            ),
                          ),
                        ),
                        Expanded(
                            child: Divider(
                                color: borderColor, thickness: 1)),
                      ]),
                      const SizedBox(height: 20),

                      // ── Trust badges ──────────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _TrustBadge(
                            icon: Icons.verified_user_rounded,
                            label: 'Secure',
                            color: textMuted,
                            bgColor: badgeBg,
                            borderColor: borderColor,
                          ),
                          const SizedBox(width: 10),
                          _TrustBadge(
                            icon: Icons.lock_rounded,
                            label: 'Private',
                            color: textMuted,
                            bgColor: badgeBg,
                            borderColor: borderColor,
                          ),
                          const SizedBox(width: 10),
                          _TrustBadge(
                            icon: Icons.shield_rounded,
                            label: 'Protected',
                            color: textMuted,
                            bgColor: badgeBg,
                            borderColor: borderColor,
                          ),
                        ],
                      ),

                      const Spacer(flex: 1),

                      // ── Footer ────────────────────────────────────────
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: Text(
                            'By continuing, you agree to our Terms of Service\nand Privacy Policy',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: textMuted,
                              fontSize: 11,
                              height: 1.6,
                              fontFamily: 'PlusJakartaSans',
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Sakyan Logo ───────────────────────────────────────────────────────────────
class _SakyanLogo extends StatelessWidget {
  final bool isDark;
  const _SakyanLogo({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 110,
          height: 110,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                AppColors.primary
                    .withOpacity(isDark ? 0.22 : 0.12),
                Colors.transparent,
              ],
            ),
          ),
        ),
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [const Color(0xFF1E2A45), const Color(0xFF0D1527)]
                  : [Colors.white, const Color(0xFFF0F4FF)],
            ),
            border: Border.all(
              color: AppColors.primary
                  .withOpacity(isDark ? 0.35 : 0.20),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary
                    .withOpacity(isDark ? 0.25 : 0.12),
                blurRadius: 20,
                spreadRadius: 1,
              ),
              if (!isDark)
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/icon.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  const _FallbackCarIcon(),
            ),
          ),
        ),
      ],
    );
  }
}

class _FallbackCarIcon extends StatelessWidget {
  const _FallbackCarIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
        ),
      ),
      child: const Center(
        child: Icon(Icons.directions_car_filled_rounded,
            color: Colors.white, size: 38),
      ),
    );
  }
}

// ── Google Sign-In button ─────────────────────────────────────────────────────
class _GoogleSignInButton extends StatelessWidget {
  final bool loading;
  final bool isDark;
  final VoidCallback onTap;

  const _GoogleSignInButton({
    required this.loading,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 56,
        decoration: BoxDecoration(
          color: loading ? const Color(0xFFE8EAED) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark
                ? Colors.white.withOpacity(0.08)
                : const Color(0xFFDADCE0),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color:
                  Colors.black.withOpacity(isDark ? 0.30 : 0.10),
              blurRadius: isDark ? 20 : 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: loading
            ? const Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.primary,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── Official Google G logo (SVG) ─────────────────────
                  SvgPicture.string(
                    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>''',
                    width: 22,
                    height: 22,
                  ),
                  const SizedBox(width: 14),
                  const Text(
                    'Continue with Google',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF3C4043),
                      letterSpacing: 0.1,
                      fontFamily: 'PlusJakartaSans',
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Trust badge ───────────────────────────────────────────────────────────────
class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;
  final Color borderColor;

  const _TrustBadge({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'PlusJakartaSans')),
        ],
      ),
    );
  }
}

// ── Decorative dots grid ──────────────────────────────────────────────────────
class _DotsGrid extends StatelessWidget {
  final Color dotColor;
  final int columns;
  final int rows;

  const _DotsGrid(
      {required this.dotColor,
      required this.columns,
      required this.rows});

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
                  color: dotColor, shape: BoxShape.circle),
            ),
          ),
        ),
      ),
    );
  }
}
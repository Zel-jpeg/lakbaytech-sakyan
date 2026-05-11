import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../providers/kyc_provider.dart';

class KycPendingScreen extends ConsumerStatefulWidget {
  const KycPendingScreen({super.key});

  @override
  ConsumerState<KycPendingScreen> createState() => _KycPendingScreenState();
}

class _KycPendingScreenState extends ConsumerState<KycPendingScreen>
    with TickerProviderStateMixin {
  Timer? _pollTimer;

  // Pulse animation — used for the pending hourglass
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  // Celebration animations — used when approved
  late AnimationController _celebCtrl;
  late Animation<double> _celebScale;
  late Animation<double> _celebFade;

  bool _showApproved = false;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _celebCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _celebScale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _celebCtrl, curve: Curves.easeOutBack),
    );
    _celebFade = CurvedAnimation(parent: _celebCtrl, curve: Curves.easeIn);

    // Poll every 30 s
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      ref.invalidate(kycStatusProvider);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _pulseCtrl.dispose();
    _celebCtrl.dispose();
    super.dispose();
  }

  void _triggerApproved() {
    if (_showApproved) return;
    _pulseCtrl.stop();
    setState(() => _showApproved = true);
    _celebCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    final kycAsync = ref.watch(kycStatusProvider);
    final theme    = Theme.of(context);
    final isDark   = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    // Show celebration screen when approved — do NOT silently redirect
    kycAsync.whenData((kyc) {
      if (kyc?.isApproved == true && mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) => _triggerApproved());
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(_showApproved ? 'Verified!' : 'Verification Pending'),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 400),
        child: _showApproved
            ? _ApprovedBody(
                key: const ValueKey('approved'),
                celebScale: _celebScale,
                celebFade:  _celebFade,
                textPrim:   textPrim,
                textSec:    textSec,
                cardColor:  cardColor,
                borderColor: borderColor,
                onGoHome: () => context.go(AppRoutes.home),
              )
            : _PendingBody(
                key: const ValueKey('pending'),
                kycAsync:    kycAsync,
                pulseAnim:   _pulseAnim,
                cardColor:   cardColor,
                borderColor: borderColor,
                textPrim:    textPrim,
                textSec:     textSec,
                textMuted:   textMuted,
                onRefresh:   () => ref.invalidate(kycStatusProvider),
                onGoHome:    () => context.go(AppRoutes.home),
              ),
      ),
    );
  }
}

// ── Approved / Congratulations body ──────────────────────────────────────────
class _ApprovedBody extends StatelessWidget {
  final Animation<double> celebScale;
  final Animation<double> celebFade;
  final Color textPrim, textSec, cardColor, borderColor;
  final VoidCallback onGoHome;

  const _ApprovedBody({
    super.key,
    required this.celebScale,
    required this.celebFade,
    required this.textPrim,
    required this.textSec,
    required this.cardColor,
    required this.borderColor,
    required this.onGoHome,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        children: [
          const Spacer(flex: 2),

          // ── Animated success icon ────────────────────────────────────────
          ScaleTransition(
            scale: celebScale,
            child: FadeTransition(
              opacity: celebFade,
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.success.withOpacity(0.4), width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.verified_rounded,
                      color: AppColors.success, size: 70),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),

          FadeTransition(
            opacity: celebFade,
            child: Column(
              children: [
                Text(
                  '🎉 You\'re Verified!',
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: textPrim),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Your identity has been approved. You can now book cars on Sakyan.',
                  style: TextStyle(color: textSec, fontSize: 14, height: 1.65),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // ── What's unlocked card ────────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: AppColors.success.withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      _UnlockRow(
                          icon: Icons.directions_car_rounded,
                          label: 'Book any car on Sakyan',
                          textPrim: textPrim),
                      const SizedBox(height: 10),
                      _UnlockRow(
                          icon: Icons.chat_bubble_rounded,
                          label: 'Message partners directly',
                          textPrim: textPrim),
                      const SizedBox(height: 10),
                      _UnlockRow(
                          icon: Icons.shield_rounded,
                          label: 'Verified badge on your profile',
                          textPrim: textPrim),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Spacer(flex: 3),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.search_rounded, size: 18),
              label: const Text('Browse Cars',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              onPressed: () => context.go(AppRoutes.cars),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onGoHome,
              child: const Text('Back to Home',
                  style: TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnlockRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color textPrim;
  const _UnlockRow(
      {required this.icon, required this.label, required this.textPrim});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.success.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.success, size: 16),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Text(label,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: textPrim)),
      ),
      const Icon(Icons.check_circle_rounded,
          color: AppColors.success, size: 16),
    ]);
  }
}

// ── Pending body ──────────────────────────────────────────────────────────────
class _PendingBody extends StatelessWidget {
  final AsyncValue<dynamic> kycAsync;
  final Animation<double> pulseAnim;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;
  final VoidCallback onRefresh;
  final VoidCallback onGoHome;

  const _PendingBody({
    super.key,
    required this.kycAsync,
    required this.pulseAnim,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.onRefresh,
    required this.onGoHome,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        children: [
          const Spacer(flex: 2),

          ScaleTransition(
            scale: pulseAnim,
            child: Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.warning.withOpacity(0.4), width: 2),
              ),
              child: const Center(
                child: Icon(Icons.hourglass_top_rounded,
                    color: AppColors.warning, size: 58),
              ),
            ),
          ),
          const SizedBox(height: 32),

          Text('Under Review',
              style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: textPrim),
              textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Text(
            'Your KYC documents have been submitted and are being reviewed by our team.',
            style: TextStyle(color: textSec, fontSize: 14, height: 1.65),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                _StatusStep(
                  icon: Icons.upload_rounded,
                  label: 'Documents Submitted',
                  done: true,
                  textPrim: textPrim,
                  textSec: textSec,
                ),
                _StepConnector(borderColor: borderColor),
                _StatusStep(
                  icon: Icons.manage_search_rounded,
                  label: 'Under Admin Review',
                  active: true,
                  textPrim: textPrim,
                  textSec: textSec,
                ),
                _StepConnector(borderColor: borderColor),
                _StatusStep(
                  icon: Icons.verified_rounded,
                  label: 'Verification Complete',
                  textPrim: textPrim,
                  textSec: textSec,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.infoBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.info.withOpacity(0.3)),
            ),
            child: Row(children: [
              const Icon(Icons.schedule_rounded,
                  color: AppColors.info, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Review typically takes 1–2 business days. '
                  'You\'ll receive a notification once approved.',
                  style: TextStyle(
                      color: AppColors.info, fontSize: 12, height: 1.5),
                ),
              ),
            ]),
          ),

          const Spacer(flex: 3),

          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: kycAsync.isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    )
                  : const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Check Status'),
              onPressed: kycAsync.isLoading ? null : onRefresh,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: onGoHome,
              child: Text('Back to Home',
                  style: TextStyle(color: textMuted)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Status step ───────────────────────────────────────────────────────────────
class _StatusStep extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool done;
  final bool active;
  final Color textPrim, textSec;

  const _StatusStep({
    required this.icon,
    required this.label,
    this.done   = false,
    this.active = false,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    final color = done
        ? AppColors.success
        : active
            ? AppColors.warning
            : AppColors.textMuted;

    return Row(children: [
      Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          shape: BoxShape.circle,
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Icon(done ? Icons.check_rounded : icon,
            color: color, size: 18),
      ),
      const SizedBox(width: 14),
      Expanded(
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: done || active ? FontWeight.w600 : FontWeight.w400,
            color: done || active ? textPrim : textSec,
          ),
        ),
      ),
      if (active)
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppColors.warning.withOpacity(0.15),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text('In Progress',
              style: TextStyle(
                  color: AppColors.warning,
                  fontSize: 10,
                  fontWeight: FontWeight.w600)),
        ),
    ]);
  }
}

class _StepConnector extends StatelessWidget {
  final Color borderColor;
  const _StepConnector({required this.borderColor});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 17, top: 4, bottom: 4),
        child: Container(
            width: 2, height: 20, color: borderColor),
      );
}
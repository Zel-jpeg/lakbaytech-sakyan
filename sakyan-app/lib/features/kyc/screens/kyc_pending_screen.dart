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
    with SingleTickerProviderStateMixin {
  Timer? _pollTimer;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();

    // Pulse animation for the pending icon
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    // Poll every 30 s — redirect when approved
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      ref.invalidate(kycStatusProvider);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
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

    // Auto-redirect if approved
    kycAsync.whenData((kyc) {
      if (kyc?.isApproved == true && mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go(AppRoutes.home);
        });
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Verification Pending')),
      body: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            const Spacer(flex: 2),

            // ── Animated pending icon ────────────────────────────────────
            ScaleTransition(
              scale: _pulseAnim,
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
              style:
                  TextStyle(color: textSec, fontSize: 14, height: 1.65),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 32),

            // ── Status steps ─────────────────────────────────────────────
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

            // ── ETA info ─────────────────────────────────────────────────
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

            // ── Refresh button ────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: kycAsync.isLoading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary),
                      )
                    : const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Check Status'),
                onPressed: kycAsync.isLoading
                    ? null
                    : () => ref.invalidate(kycStatusProvider),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => context.go(AppRoutes.home),
                child: Text('Back to Home',
                    style: TextStyle(color: textMuted)),
              ),
            ),
          ],
        ),
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
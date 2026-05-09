import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/router/app_router.dart';
import '../../providers/partner_provider.dart';

class Step4PendingScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> applicationData;
  const Step4PendingScreen({super.key, required this.applicationData});

  @override
  ConsumerState<Step4PendingScreen> createState() =>
      _Step4PendingScreenState();
}

class _Step4PendingScreenState extends ConsumerState<Step4PendingScreen>
    with SingleTickerProviderStateMixin {
  Timer? _pollTimer;
  bool _submitted = false;

  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.88, end: 1.0)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    _submitApplication();
  }

  Future<void> _submitApplication() async {
    try {
      final payload = Map<String, dynamic>.from(widget.applicationData);
      // Strip the File objects — URLs were already uploaded in Step 3
      payload.removeWhere((k, v) => v is! String);

      await ref.read(applyPartnerProvider.notifier).apply(payload);
      if (mounted) setState(() => _submitted = true);

      // Poll every 30s
      _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        ref.invalidate(partnerProfileProvider);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Submission failed: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final applyState = ref.watch(applyPartnerProvider);
    final profileAsync = ref.watch(partnerProfileProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    // Auto-redirect when approved
    profileAsync.whenData((partner) {
      if (partner?.isApproved == true && mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.go(AppRoutes.partnerHome);
        });
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Animated pending icon ──────────────────────────────────
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

              Text('Application Submitted!',
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: textPrim),
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text(
                'Your partner application is under review. '
                'You\'ll be notified once approved.',
                style: TextStyle(color: textSec, fontSize: 14, height: 1.65),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // ── Status steps ─────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(children: [
                  _Step(
                      icon: Icons.upload_rounded,
                      label: 'Application Submitted',
                      done: _submitted,
                      active: !_submitted,
                      textPrim: textPrim,
                      textSec: textSec),
                  _Connector(color: borderColor),
                  _Step(
                      icon: Icons.manage_search_rounded,
                      label: 'Admin Review',
                      active: _submitted,
                      textPrim: textPrim,
                      textSec: textSec),
                  _Connector(color: borderColor),
                  _Step(
                      icon: Icons.verified_rounded,
                      label: 'Partner Approved',
                      textPrim: textPrim,
                      textSec: textSec),
                ]),
              ),
              const SizedBox(height: 20),

              // ── ETA info ─────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.infoBg,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: AppColors.info.withOpacity(0.3)),
                ),
                child: Row(children: [
                  const Icon(Icons.schedule_rounded,
                      color: AppColors.info, size: 16),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Review typically takes 1–3 business days. '
                      'Commission rate is 10% per successful booking.',
                      style: TextStyle(
                          color: AppColors.info, fontSize: 12, height: 1.5),
                    ),
                  ),
                ]),
              ),

              const Spacer(flex: 3),

              // ── Check status button ───────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: applyState.isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary))
                      : const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Check Status'),
                  onPressed: applyState.isLoading
                      ? null
                      : () => ref.invalidate(partnerProfileProvider),
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
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool done, active;
  final Color textPrim, textSec;
  const _Step({
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
        child: Text(label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: done || active ? FontWeight.w600 : FontWeight.w400,
              color: done || active ? textPrim : textSec,
            )),
      ),
      if (active)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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

class _Connector extends StatelessWidget {
  final Color color;
  const _Connector({required this.color});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 17, top: 4, bottom: 4),
        child: Container(width: 2, height: 20, color: color),
      );
}
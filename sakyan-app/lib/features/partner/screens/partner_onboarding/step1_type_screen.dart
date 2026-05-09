import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/router/app_router.dart';

class Step1TypeScreen extends StatefulWidget {
  const Step1TypeScreen({super.key});

  @override
  State<Step1TypeScreen> createState() => _Step1TypeScreenState();
}

class _Step1TypeScreenState extends State<Step1TypeScreen> {
  String _selected = 'individual';

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(title: const Text('Become a Partner')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Progress ──────────────────────────────────────────────
            OnboardingProgressBar(step: 1, total: 4, borderColor: borderColor),
            const SizedBox(height: 8),
            Text('Step 1 of 4',
                style: TextStyle(color: textMuted, fontSize: 12)),
            const SizedBox(height: 32),

            // ── Icon ──────────────────────────────────────────────────
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primaryGlow,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.handshake_rounded,
                  color: AppColors.primary, size: 36),
            ),
            const SizedBox(height: 20),

            Text('Partner Type',
                style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: textPrim)),
            const SizedBox(height: 8),
            Text(
              'Select the type of partner account you want to create.',
              style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
            ),
            const SizedBox(height: 32),

            // ── Individual option ─────────────────────────────────────
            _TypeCard(
              selected:    _selected == 'individual',
              icon:        Icons.person_rounded,
              title:       'Individual',
              subtitle:    'I own a car and want to list it personally.',
              cardColor:   cardColor,
              borderColor: borderColor,
              textPrim:    textPrim,
              textSec:     textSec,
              onTap:       () => setState(() => _selected = 'individual'),
            ),
            const SizedBox(height: 16),

            // ── Company option ────────────────────────────────────────
            _TypeCard(
              selected:    _selected == 'company',
              icon:        Icons.business_rounded,
              title:       'Company',
              subtitle:    'I operate a business with multiple vehicles.',
              cardColor:   cardColor,
              borderColor: borderColor,
              textPrim:    textPrim,
              textSec:     textSec,
              onTap:       () => setState(() => _selected = 'company'),
            ),

            const Spacer(),

            // ── Next ──────────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.push(
                  AppRoutes.onboardingStep2,
                  extra: {'partnerType': _selected},
                ),
                child: const Text('Continue',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Type selection card ───────────────────────────────────────────────────────
class _TypeCard extends StatelessWidget {
  final bool selected;
  final IconData icon;
  final String title, subtitle;
  final Color cardColor, borderColor, textPrim, textSec;
  final VoidCallback onTap;

  const _TypeCard({
    required this.selected,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color:        selected ? AppColors.primaryGlow : cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppColors.primary : borderColor,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : AppColors.primaryGlow,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon,
                  color: selected ? Colors.white : AppColors.primary,
                  size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 13, color: textSec, height: 1.4)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: selected ? AppColors.primary : borderColor,
                  width: 2,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Step progress bar — PUBLIC so step2 and step3 can import it ───────────────
class OnboardingProgressBar extends StatelessWidget {
  final int step, total;
  final Color borderColor;

  const OnboardingProgressBar({
    super.key,
    required this.step,
    required this.total,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        final done   = i < step;
        final active = i == step - 1;
        return Expanded(
          child: Container(
            height: 4,
            margin: EdgeInsets.only(right: i < total - 1 ? 6 : 0),
            decoration: BoxDecoration(
              color: done || active ? AppColors.primary : borderColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }
}
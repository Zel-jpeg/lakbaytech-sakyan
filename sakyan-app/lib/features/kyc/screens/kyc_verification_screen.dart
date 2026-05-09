import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../providers/kyc_provider.dart';

class KycVerificationScreen extends ConsumerStatefulWidget {
  const KycVerificationScreen({super.key});

  @override
  ConsumerState<KycVerificationScreen> createState() =>
      _KycVerificationScreenState();
}

class _KycVerificationScreenState
    extends ConsumerState<KycVerificationScreen> {
  int _step = 0; // 0=Intro, 1=License, 2=Valid ID, 3=Selfie, 4=Review
  File? _licenseFile;
  File? _validIdFile;
  File? _selfieFile;

  final _picker = ImagePicker();

  // ── Pick image from camera or gallery ─────────────────────────────────────
  Future<File?> _pickImage({bool camera = false}) async {
    final xFile = await _picker.pickImage(
      source: camera ? ImageSource.camera : ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (xFile == null) return null;
    return File(xFile.path);
  }

  // ── Show source picker bottom sheet ───────────────────────────────────────
  Future<File?> _showSourcePicker(BuildContext context) async {
    File? result;
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Select Source',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: _SourceButton(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    onTap: () async {
                      Navigator.pop(ctx);
                      result = await _pickImage(camera: true);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SourceButton(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    onTap: () async {
                      Navigator.pop(ctx);
                      result = await _pickImage(camera: false);
                    },
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
    return result;
  }

  Future<void> _submit() async {
    final kyc = await ref.read(submitKycProvider.notifier).submit(
          licenseFile: _licenseFile!,
          validIdFile: _validIdFile!,
          selfieFile:  _selfieFile!,
        );
    if (!mounted) return;
    if (kyc != null) {
      context.go(AppRoutes.kycPending);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Submission failed. Please try again.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitState = ref.watch(submitKycProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('KYC Verification'),
        leading: _step > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => setState(() => _step--),
              )
            : null,
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        child: KeyedSubtree(
          key: ValueKey(_step),
          child: _buildStep(
            context,
            isDark: isDark,
            cardColor: cardColor,
            borderColor: borderColor,
            textPrim: textPrim,
            textSec: textSec,
            textMuted: textMuted,
            submitState: submitState,
          ),
        ),
      ),
    );
  }

  Widget _buildStep(
    BuildContext context, {
    required bool isDark,
    required Color cardColor,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color textMuted,
    required AsyncValue submitState,
  }) {
    switch (_step) {
      case 0:
        return _IntroStep(
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          onNext: () => setState(() => _step = 1),
        );
      case 1:
        return _DocumentStep(
          title: "Driver's License",
          subtitle: 'Upload a clear photo of your valid driver\'s license.',
          icon: Icons.badge_rounded,
          file: _licenseFile,
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          textMuted: textMuted,
          stepNumber: 1,
          totalSteps: 3,
          onPickImage: () async {
            final f = await _showSourcePicker(context);
            if (f != null) setState(() => _licenseFile = f);
          },
          onNext: _licenseFile != null
              ? () => setState(() => _step = 2)
              : null,
        );
      case 2:
        return _DocumentStep(
          title: 'Valid Government ID',
          subtitle: 'Upload any valid government-issued ID (passport, SSS, PhilHealth, etc.).',
          icon: Icons.credit_card_rounded,
          file: _validIdFile,
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          textMuted: textMuted,
          stepNumber: 2,
          totalSteps: 3,
          onPickImage: () async {
            final f = await _showSourcePicker(context);
            if (f != null) setState(() => _validIdFile = f);
          },
          onNext: _validIdFile != null
              ? () => setState(() => _step = 3)
              : null,
        );
      case 3:
        return _DocumentStep(
          title: 'Selfie with ID',
          subtitle: 'Take a selfie while holding your government ID next to your face.',
          icon: Icons.face_rounded,
          file: _selfieFile,
          cardColor: cardColor,
          borderColor: borderColor,
          textPrim: textPrim,
          textSec: textSec,
          textMuted: textMuted,
          stepNumber: 3,
          totalSteps: 3,
          preferCamera: true,
          onPickImage: () async {
            final f = await _showSourcePicker(context);
            if (f != null) setState(() => _selfieFile = f);
          },
          onNext: _selfieFile != null
              ? () => setState(() => _step = 4)
              : null,
        );
      case 4:
        return _ReviewStep(
          licenseFile:  _licenseFile!,
          validIdFile:  _validIdFile!,
          selfieFile:   _selfieFile!,
          cardColor:    cardColor,
          borderColor:  borderColor,
          textPrim:     textPrim,
          textSec:      textSec,
          textMuted:    textMuted,
          isLoading:    submitState.isLoading,
          onReplace: (index) => setState(() => _step = index + 1),
          onSubmit:  _submit,
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

// ── Step 0 — Intro ─────────────────────────────────────────────────────────
class _IntroStep extends StatelessWidget {
  final Color cardColor, borderColor, textPrim, textSec;
  final VoidCallback onNext;

  const _IntroStep({
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero
          Center(
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primaryGlow,
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.primary.withOpacity(0.3), width: 2),
              ),
              child: const Icon(Icons.verified_user_rounded,
                  color: AppColors.primary, size: 56),
            ),
          ),
          const SizedBox(height: 28),
          Text('Verify Your Identity',
              style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: textPrim)),
          const SizedBox(height: 10),
          Text(
            'KYC verification is required to make bookings on Sakyan. '
            'It helps us keep the community safe and trusted.',
            style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 28),
          // Steps overview
          _InfoCard(
            icon: Icons.badge_rounded,
            title: "Step 1 — Driver's License",
            subtitle: 'A clear photo of your valid license',
            cardColor: cardColor,
            borderColor: borderColor,
            textPrim: textPrim,
            textSec: textSec,
          ),
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.credit_card_rounded,
            title: 'Step 2 — Government ID',
            subtitle: 'Passport, SSS, PhilHealth, or any valid ID',
            cardColor: cardColor,
            borderColor: borderColor,
            textPrim: textPrim,
            textSec: textSec,
          ),
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.face_rounded,
            title: 'Step 3 — Selfie with ID',
            subtitle: 'Hold your ID next to your face',
            cardColor: cardColor,
            borderColor: borderColor,
            textPrim: textPrim,
            textSec: textSec,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.infoBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.info.withOpacity(0.3)),
            ),
            child: Row(children: [
              const Icon(Icons.lock_rounded, color: AppColors.info, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Your documents are encrypted and stored securely. They will only be used for verification.',
                  style: TextStyle(
                      color: AppColors.info, fontSize: 12, height: 1.5),
                ),
              ),
            ]),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              child: const Text('Start Verification',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final Color cardColor, borderColor, textPrim, textSec;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Row(children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primaryGlow,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: textPrim)),
              Text(subtitle,
                  style: TextStyle(fontSize: 12, color: textSec)),
            ],
          ),
        ),
      ]),
    );
  }
}

// ── Document upload step ───────────────────────────────────────────────────
class _DocumentStep extends StatelessWidget {
  final String title, subtitle;
  final IconData icon;
  final File? file;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;
  final int stepNumber, totalSteps;
  final bool preferCamera;
  final VoidCallback onPickImage;
  final VoidCallback? onNext;

  const _DocumentStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.file,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.stepNumber,
    required this.totalSteps,
    required this.onPickImage,
    required this.onNext,
    this.preferCamera = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress
          Row(
            children: List.generate(totalSteps, (i) {
              final done = i < stepNumber;
              final active = i == stepNumber - 1;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < totalSteps - 1 ? 6 : 0),
                  decoration: BoxDecoration(
                    color: done || active
                        ? AppColors.primary
                        : borderColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Text('Step $stepNumber of $totalSteps',
              style: TextStyle(color: textMuted, fontSize: 12)),
          const SizedBox(height: 24),

          Text(title,
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: textPrim)),
          const SizedBox(height: 8),
          Text(subtitle,
              style: TextStyle(color: textSec, fontSize: 14, height: 1.6)),
          const SizedBox(height: 28),

          // Upload zone
          GestureDetector(
            onTap: onPickImage,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: double.infinity,
              height: 220,
              decoration: BoxDecoration(
                color: file != null
                    ? Colors.transparent
                    : cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color:
                      file != null ? AppColors.success : borderColor,
                  width: file != null ? 2 : 1,
                  style: file != null
                      ? BorderStyle.solid
                      : BorderStyle.solid,
                ),
              ),
              child: file != null
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.file(file!, fit: BoxFit.cover),
                        ),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check_rounded,
                                color: Colors.white, size: 16),
                          ),
                        ),
                        Positioned(
                          bottom: 12,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text('Tap to replace',
                                  style: TextStyle(
                                      color: Colors.white, fontSize: 12)),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGlow,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            preferCamera
                                ? Icons.camera_alt_rounded
                                : icon,
                            color: AppColors.primary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          preferCamera
                              ? 'Tap to take a selfie'
                              : 'Tap to upload',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: textPrim),
                        ),
                        const SizedBox(height: 4),
                        Text('Camera or Gallery',
                            style: TextStyle(
                                fontSize: 12, color: textMuted)),
                      ],
                    ),
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              child: Text(
                stepNumber == totalSteps ? 'Review & Submit' : 'Continue',
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Review step ────────────────────────────────────────────────────────────
class _ReviewStep extends StatelessWidget {
  final File licenseFile, validIdFile, selfieFile;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;
  final bool isLoading;
  final void Function(int) onReplace;
  final VoidCallback onSubmit;

  const _ReviewStep({
    required this.licenseFile,
    required this.validIdFile,
    required this.selfieFile,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.isLoading,
    required this.onReplace,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final docs = [
      (file: licenseFile,  label: "Driver's License",  icon: Icons.badge_rounded),
      (file: validIdFile,  label: 'Government ID',      icon: Icons.credit_card_rounded),
      (file: selfieFile,   label: 'Selfie with ID',     icon: Icons.face_rounded),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Review Documents',
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: textPrim)),
          const SizedBox(height: 8),
          Text(
            'Please review your uploaded documents before submitting.',
            style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 24),
          ...List.generate(docs.length, (i) {
            final d = docs[i];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                decoration: BoxDecoration(
                  color: cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(14)),
                      child: Image.file(
                        d.file,
                        width: double.infinity,
                        height: 160,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
                      child: Row(children: [
                        Icon(d.icon, color: AppColors.primary, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(d.label,
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: textPrim,
                                  fontSize: 13)),
                        ),
                        TextButton(
                          onPressed: () => onReplace(i),
                          child: const Text('Replace',
                              style: TextStyle(
                                  color: AppColors.primary, fontSize: 12)),
                        ),
                      ]),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warningBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.warning.withOpacity(0.3)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_rounded,
                    color: AppColors.warning, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Once submitted, documents cannot be changed. '
                    'Review admin approval typically takes 1–2 business days.',
                    style: TextStyle(
                        color: AppColors.warning,
                        fontSize: 12,
                        height: 1.5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              child: isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit for Review',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Source button ──────────────────────────────────────────────────────────
class _SourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SourceButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: AppColors.primaryGlow,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.primary, size: 28),
          const SizedBox(height: 8),
          Text(label,
              style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13)),
        ]),
      ),
    );
  }
}
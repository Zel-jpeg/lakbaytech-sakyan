import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/router/app_router.dart';
import '../../providers/partner_provider.dart';
import 'step1_type_screen.dart' show OnboardingProgressBar;

class Step3DocsScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> data;
  const Step3DocsScreen({super.key, required this.data});

  @override
  ConsumerState<Step3DocsScreen> createState() => _Step3DocsScreenState();
}

class _Step3DocsScreenState extends ConsumerState<Step3DocsScreen> {
  File? _govIdFile;
  File? _bizPermitFile;
  bool _uploading = false;

  bool get _isCompany  => widget.data['partnerType'] == 'company';
  bool get _canSubmit  =>
      _govIdFile != null && (_isCompany ? _bizPermitFile != null : true);

  final _picker = ImagePicker();

  Future<File?> _pick({bool camera = false}) async {
    final x = await _picker.pickImage(
      source: camera ? ImageSource.camera : ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
    );
    return x == null ? null : File(x.path);
  }

  Future<File?> _showSheet(BuildContext context) async {
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
                      borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              const Text('Upload Document',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: _SrcBtn(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    onTap: () async {
                      Navigator.pop(ctx);
                      result = await _pick(camera: true);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SrcBtn(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    onTap: () async {
                      Navigator.pop(ctx);
                      result = await _pick();
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
    setState(() => _uploading = true);
    try {
      final repo = ref.read(partnerRepositoryProvider);

      // Upload government ID
      final govIdUrl =
          await repo.uploadPartnerDoc(_govIdFile!, 'government-id');

      // Upload business permit if company
      String? bizPermitUrl;
      if (_isCompany && _bizPermitFile != null) {
        bizPermitUrl =
            await repo.uploadPartnerDoc(_bizPermitFile!, 'business-permit');
      }

      final payload = {
        ...widget.data,
        'government_id_url': govIdUrl,
        if (bizPermitUrl != null) 'business_permit_url': bizPermitUrl,
      };

      if (!mounted) return;
      context.push(AppRoutes.onboardingStep4, extra: payload);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

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
      appBar: AppBar(title: const Text('Upload Documents')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  OnboardingProgressBar(step: 3, total: 4, borderColor: borderColor),
                  const SizedBox(height: 8),
                  Text('Step 3 of 4',
                      style: TextStyle(color: textMuted, fontSize: 12)),
                  const SizedBox(height: 32),

                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.upload_file_rounded,
                        color: AppColors.primary, size: 36),
                  ),
                  const SizedBox(height: 20),

                  Text('Required Documents',
                      style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: textPrim)),
                  const SizedBox(height: 8),
                  Text(
                    _isCompany
                        ? 'Upload your government ID and business permit for verification.'
                        : 'Upload a valid government-issued ID for verification.',
                    style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
                  ),
                  const SizedBox(height: 32),

                  // ── Government ID ──────────────────────────────────────
                  _DocLabel(
                    label: 'Government-Issued ID',
                    subtitle:
                        'Passport, SSS, PhilHealth, UMID, Driver\'s License',
                    required: true,
                    textPrim: textPrim,
                    textSec: textSec,
                  ),
                  const SizedBox(height: 10),
                  _UploadZone(
                    file:        _govIdFile,
                    cardColor:   cardColor,
                    borderColor: borderColor,
                    textPrim:    textPrim,
                    textMuted:   textMuted,
                    icon:        Icons.credit_card_rounded,
                    hint:        'Tap to upload government ID',
                    onTap: () async {
                      final f = await _showSheet(context);
                      if (f != null) setState(() => _govIdFile = f);
                    },
                  ),
                  const SizedBox(height: 24),

                  // ── Business permit (company only) ─────────────────────
                  if (_isCompany) ...[
                    _DocLabel(
                      label: 'Business Permit',
                      subtitle:
                          'DTI, SEC Registration, or Mayor\'s Permit',
                      required: true,
                      textPrim: textPrim,
                      textSec: textSec,
                    ),
                    const SizedBox(height: 10),
                    _UploadZone(
                      file:        _bizPermitFile,
                      cardColor:   cardColor,
                      borderColor: borderColor,
                      textPrim:    textPrim,
                      textMuted:   textMuted,
                      icon:        Icons.business_center_rounded,
                      hint:        'Tap to upload business permit',
                      onTap: () async {
                        final f = await _showSheet(context);
                        if (f != null) setState(() => _bizPermitFile = f);
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Security notice ────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: AppColors.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.security_rounded,
                            color: AppColors.primary, size: 18),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Your documents are encrypted and stored securely on Supabase. '
                            'They are only used for one-time verification by Sakyan admins.',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                height: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Sticky submit ────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(
                24, 12, 24, MediaQuery.of(context).padding.bottom + 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _canSubmit && !_uploading ? _submit : null,
                child: _uploading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit Application',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Document label ────────────────────────────────────────────────────────────
class _DocLabel extends StatelessWidget {
  final String label, subtitle;
  final bool required;
  final Color textPrim, textSec;
  const _DocLabel({
    required this.label,
    required this.subtitle,
    this.required = false,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(label,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textPrim)),
            if (required)
              const Text(' *',
                  style: TextStyle(color: AppColors.error, fontSize: 14)),
          ]),
          Text(subtitle,
              style: TextStyle(fontSize: 12, color: textSec)),
        ],
      );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
class _UploadZone extends StatelessWidget {
  final File? file;
  final Color cardColor, borderColor, textPrim, textMuted;
  final IconData icon;
  final String hint;
  final VoidCallback onTap;

  const _UploadZone({
    required this.file,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.icon,
    required this.hint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 180,
        decoration: BoxDecoration(
          color: file != null ? Colors.transparent : cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: file != null ? AppColors.success : borderColor,
            width: file != null ? 2 : 1,
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
                          shape: BoxShape.circle),
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
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: AppColors.primary, size: 28),
                  ),
                  const SizedBox(height: 12),
                  Text(hint,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textPrim)),
                  const SizedBox(height: 4),
                  Text('Camera or Gallery',
                      style: TextStyle(fontSize: 12, color: textMuted)),
                ],
              ),
      ),
    );
  }
}

// ── Source button ─────────────────────────────────────────────────────────────
class _SrcBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SrcBtn(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
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
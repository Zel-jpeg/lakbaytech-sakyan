import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/router/app_router.dart';
import 'step1_type_screen.dart' show OnboardingProgressBar;

class Step2InfoScreen extends StatefulWidget {
  final String partnerType;
  const Step2InfoScreen({super.key, required this.partnerType});

  @override
  State<Step2InfoScreen> createState() => _Step2InfoScreenState();
}

class _Step2InfoScreenState extends State<Step2InfoScreen> {
  final _formKey        = GlobalKey<FormState>();
  final _bizNameCtrl    = TextEditingController();
  final _bizAddressCtrl = TextEditingController();
  final _contactCtrl    = TextEditingController();
  final _phoneCtrl      = TextEditingController();

  bool get _isCompany => widget.partnerType == 'company';

  @override
  void dispose() {
    _bizNameCtrl.dispose();
    _bizAddressCtrl.dispose();
    _contactCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _next() {
    if (!_formKey.currentState!.validate()) return;
    context.push(AppRoutes.onboardingStep3, extra: {
      'partnerType':     widget.partnerType,
      'businessName':    _bizNameCtrl.text.trim(),
      'businessAddress': _bizAddressCtrl.text.trim(),
      'contactPerson':   _contactCtrl.text.trim(),
      'contactPhone':    _phoneCtrl.text.trim(),
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(title: const Text('Business Information')),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    OnboardingProgressBar(step: 2, total: 4, borderColor: borderColor),
                    const SizedBox(height: 8),
                    Text('Step 2 of 4',
                        style: TextStyle(color: textMuted, fontSize: 12)),
                    const SizedBox(height: 32),

                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        _isCompany
                            ? Icons.business_rounded
                            : Icons.person_rounded,
                        color: AppColors.primary,
                        size: 36,
                      ),
                    ),
                    const SizedBox(height: 20),

                    Text('Your Information',
                        style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: textPrim)),
                    const SizedBox(height: 8),
                    Text(
                      'Fill in your details. This will be reviewed by the Sakyan team.',
                      style: TextStyle(color: textSec, fontSize: 14, height: 1.6),
                    ),
                    const SizedBox(height: 32),

                    // ── Business name ──────────────────────────────────────
                    _Label(
                        label: _isCompany ? 'Company Name' : 'Full Name',
                        textSec: textSec),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bizNameCtrl,
                      style: TextStyle(color: textPrim),
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        hintText: _isCompany
                            ? 'e.g. ABC Rentals Inc.'
                            : 'Your full legal name',
                        prefixIcon: Icon(
                          _isCompany
                              ? Icons.business_rounded
                              : Icons.person_rounded,
                          color: textMuted,
                          size: 20,
                        ),
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Business address ───────────────────────────────────
                    _Label(
                        label: _isCompany
                            ? 'Business Address'
                            : 'Home Address',
                        textSec: textSec),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bizAddressCtrl,
                      style: TextStyle(color: textPrim),
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'Street, City, Province',
                        prefixIcon: Padding(
                          padding: const EdgeInsets.only(bottom: 22),
                          child: Icon(Icons.location_on_rounded,
                              color: textMuted, size: 20),
                        ),
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Contact person (company only) ──────────────────────
                    if (_isCompany) ...[
                      _Label(label: 'Contact Person', textSec: textSec),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _contactCtrl,
                        style: TextStyle(color: textPrim),
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: 'Name of authorized contact',
                          prefixIcon: Icon(Icons.badge_rounded,
                              color: textMuted, size: 20),
                        ),
                        validator: (v) => _isCompany &&
                                (v == null || v.trim().isEmpty)
                            ? 'Required for company'
                            : null,
                      ),
                      const SizedBox(height: 20),
                    ],

                    // ── Contact phone ──────────────────────────────────────
                    _Label(label: 'Contact Phone', textSec: textSec),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _phoneCtrl,
                      style: TextStyle(color: textPrim),
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: '09XX XXX XXXX',
                        prefixIcon: Icon(Icons.phone_rounded,
                            color: textMuted, size: 20),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Required';
                        if (v.trim().length < 10) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    // ── Info notice ────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.infoBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.info.withOpacity(0.3)),
                      ),
                      child: Row(children: [
                        const Icon(Icons.info_rounded,
                            color: AppColors.info, size: 16),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Your information will only be visible to Sakyan admins for verification purposes.',
                            style: TextStyle(
                                color: AppColors.info,
                                fontSize: 12,
                                height: 1.5),
                          ),
                        ),
                      ]),
                    ),
                  ],
                ),
              ),
            ),

            // ── Sticky button ──────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(
                  24, 12, 24, MediaQuery.of(context).padding.bottom + 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _next,
                  child: const Text('Continue',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String label;
  final Color textSec;
  const _Label({required this.label, required this.textSec});

  @override
  Widget build(BuildContext context) => Text(
        label,
        style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: textSec),
      );
}
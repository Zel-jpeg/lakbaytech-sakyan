import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/messages_app_bar_action.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../kyc/providers/kyc_provider.dart';

/// The Sakyan web app URL — update this when the domain is finalised.
const _kSakyanWebUrl = 'https://lakbaytech-sakyan.vercel.app/';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user      = ref.watch(currentUserProvider);
    final isDark    = ref.watch(isDarkModeProvider);
    final kycAsync  = ref.watch(kycStatusProvider);

    final bgSurface  = isDark ? AppColors.bgSurface     : AppColors.bgSurfaceLight;
    final bgElevated = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;
    final border     = isDark ? AppColors.border         : AppColors.borderLight;
    final textPrim   = isDark ? AppColors.textPrimary    : AppColors.textPrimaryLight;
    final textSec    = isDark ? AppColors.textSecondary  : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          const MessagesAppBarAction(),
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded),
            tooltip: isDark ? 'Switch to Light' : 'Switch to Dark',
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          _ProfileHeader(
            user: user,
            isDark: isDark,
            bgSurface: bgSurface,
            border: border,
            textPrim: textPrim,
            textSec: textSec,
          ),
          const SizedBox(height: 24),

          // ── Account section ────────────────────────────────────────────
          _SectionLabel(label: 'Account', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(
            isDark: isDark,
            bgSurface: bgSurface,
            border: border,
            children: [
              _SettingsTile(
                icon: Icons.person_rounded,
                label: 'Full Name',
                value: user?.fullName,
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
              ),
              _Divider(color: border),
              _SettingsTile(
                icon: Icons.email_rounded,
                label: 'Email',
                value: user?.email,
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
              ),
              _Divider(color: border),
              _SettingsTile(
                icon: Icons.phone_rounded,
                label: 'Phone',
                value: user?.phone.isNotEmpty == true ? user!.phone : 'Not set',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
              ),
              _Divider(color: border),
              _SettingsTile(
                icon: Icons.badge_rounded,
                label: 'Role',
                value: _roleLabel(user?.role),
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── PARTNER DASHBOARD (approved partners only) ─────────────────
          if (user?.isPartner == true) ...[
            _SectionLabel(label: 'Partner', textSec: textSec),
            const SizedBox(height: 8),
            _SettingsCard(
              isDark: isDark,
              bgSurface: bgSurface,
              border: border,
              children: [
                _SettingsNavTile(
                  icon: Icons.dashboard_rounded,
                  label: 'Go to Partner Dashboard',
                  subtitle: 'Manage cars, bookings and earnings',
                  isDark: isDark,
                  textPrim: textPrim,
                  textSec: textSec,
                  onTap: () => context.go(AppRoutes.partnerHome),
                ),
                _Divider(color: border),
                _SettingsNavTile(
                  icon: Icons.directions_car_rounded,
                  label: 'My Cars',
                  subtitle: 'View and manage your listings',
                  isDark: isDark,
                  textPrim: textPrim,
                  textSec: textSec,
                  onTap: () => context.go(AppRoutes.partnerCars),
                ),
                _Divider(color: border),
                _SettingsNavTile(
                  icon: Icons.bar_chart_rounded,
                  label: 'Earnings',
                  subtitle: 'Revenue and commission breakdown',
                  isDark: isDark,
                  textPrim: textPrim,
                  textSec: textSec,
                  onTap: () => context.push(AppRoutes.earnings),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],

          // ── KYC section (customer only) ────────────────────────────────
          if (user?.isCustomer == true) ...[
            _SectionLabel(label: 'Verification', textSec: textSec),
            const SizedBox(height: 8),
            _KycStatusCard(
              kycAsync:   kycAsync,
              isDark:     isDark,
              bgSurface:  bgSurface,
              border:     border,
              textPrim:   textPrim,
              textSec:    textSec,
            ),
            const SizedBox(height: 20),
          ],

          // ── Become a Partner (customer only) ───────────────────────────
          if (user?.isCustomer == true) ...[
            _SectionLabel(label: 'Earn with Sakyan', textSec: textSec),
            const SizedBox(height: 8),
            _SettingsCard(
              isDark: isDark,
              bgSurface: bgSurface,
              border: border,
              children: [
                // ── "Start Listing" tile — opens the Coming Soon guide ──
                _StartListingTile(
                  isDark:   isDark,
                  textPrim: textPrim,
                  textSec:  textSec,
                  onTap: () => _showStartListingSheet(context, isDark),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],

          // ── Settings section ───────────────────────────────────────────
          _SectionLabel(label: 'Settings', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(
            isDark: isDark,
            bgSurface: bgSurface,
            border: border,
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.dark_mode_rounded,
                          color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Dark Mode',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: textPrim)),
                          Text(isDark ? 'Currently dark' : 'Currently light',
                              style:
                                  TextStyle(fontSize: 12, color: textSec)),
                        ],
                      ),
                    ),
                    Switch(
                      value: isDark,
                      onChanged: (_) =>
                          ref.read(themeModeProvider.notifier).toggle(),
                    ),
                  ],
                ),
              ),
              _Divider(color: border),
              _SettingsNavTile(
                icon: Icons.notifications_rounded,
                label: 'Notifications',
                subtitle: 'Manage push & in-app alerts',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () => context.push(AppRoutes.notifications),
              ),
              _Divider(color: border),
              _SettingsNavTile(
                icon: Icons.chat_bubble_rounded,
                label: 'Messages',
                subtitle: 'View your conversations',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () => context.push(AppRoutes.inbox),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── About section ──────────────────────────────────────────────
          _SectionLabel(label: 'About', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(
            isDark: isDark,
            bgSurface: bgSurface,
            border: border,
            children: [
              _SettingsTile(
                icon: Icons.info_rounded,
                label: 'App Version',
                value: '1.0.0',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
              ),
              _Divider(color: border),
              _SettingsNavTile(
                icon: Icons.description_rounded,
                label: 'Terms of Service',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () {},
              ),
              _Divider(color: border),
              _SettingsNavTile(
                icon: Icons.privacy_tip_rounded,
                label: 'Privacy Policy',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () {},
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── Sign out ───────────────────────────────────────────────────
          _SettingsCard(
            isDark: isDark,
            bgSurface: bgSurface,
            border: border,
            children: [
              _SettingsNavTile(
                icon: Icons.logout_rounded,
                label: 'Sign Out',
                iconColor: AppColors.error,
                labelColor: AppColors.error,
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () => _confirmSignOut(context, ref),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _roleLabel(String? role) {
    switch (role) {
      case 'partner':
        return 'Partner';
      case 'admin':
        return 'Admin';
      default:
        return 'Customer';
    }
  }

  // ── Coming Soon bottom sheet ───────────────────────────────────────────────
  void _showStartListingSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StartListingSheet(isDark: isDark),
    );
  }

  Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text(
            'Are you sure you want to sign out?\nYou can sign back in anytime with Google.'),
        actions: [
          TextButton(
            onPressed: () =>
                Navigator.of(ctx, rootNavigator: true).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () =>
                Navigator.of(ctx, rootNavigator: true).pop(true),
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(authNotifierProvider.notifier).signOut();
    } catch (_) {}

    if (context.mounted) {
      context.go(AppRoutes.login);
    }
  }
}

// ── "Start Listing" tile with "Coming Soon" badge ─────────────────────────────
class _StartListingTile extends StatelessWidget {
  final bool isDark;
  final Color textPrim, textSec;
  final VoidCallback onTap;

  const _StartListingTile({
    required this.isDark,
    required this.textPrim,
    required this.textSec,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.directions_car_rounded,
                color: AppColors.primary,
                size: 18,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Become a Partner',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: textPrim,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // "Coming Soon" badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.13),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: AppColors.warning.withOpacity(0.35)),
                        ),
                        child: const Text(
                          'Coming Soon',
                          style: TextStyle(
                            color: AppColors.warning,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'List your car and start earning',
                    style: TextStyle(fontSize: 12, color: textSec),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: textSec, size: 20),
          ],
        ),
      ),
    );
  }
}

// ── Coming Soon Bottom Sheet ──────────────────────────────────────────────────
class _StartListingSheet extends StatelessWidget {
  final bool isDark;

  const _StartListingSheet({required this.isDark});

  Future<void> _openWebApp() async {
    final uri = Uri.parse(_kSakyanWebUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // Fallback: try platform default (opens in-app WebView if needed)
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    }
  }

  Future<void> _copyUrl(BuildContext context) async {
    await Clipboard.setData(const ClipboardData(text: _kSakyanWebUrl));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bgSurface  = isDark ? AppColors.bgSurface     : AppColors.bgSurfaceLight;
    final bgElevated = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;
    final bgBase     = isDark ? AppColors.bgBase        : AppColors.bgBaseLight;
    final border     = isDark ? AppColors.border         : AppColors.borderLight;
    final textPrim   = isDark ? AppColors.textPrimary    : AppColors.textPrimaryLight;
    final textSec    = isDark ? AppColors.textSecondary  : AppColors.textSecondaryLight;
    final textMuted  = isDark ? AppColors.textMuted      : AppColors.textMutedLight;

    return Container(
      decoration: BoxDecoration(
        color: bgSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                20,
                16,
                20,
                MediaQuery.of(context).viewInsets.bottom + 32,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Header ─────────────────────────────────────────────
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: AppColors.primaryGradient,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.directions_car_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Start Listing Your Car',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: textPrim,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.warning.withOpacity(0.13),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: AppColors.warning.withOpacity(0.35),
                                    ),
                                  ),
                                  child: const Text(
                                    '🚧  In-App Feature Coming Soon',
                                    style: TextStyle(
                                      color: AppColors.warning,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Notice card ────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.info.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: AppColors.info.withOpacity(0.25)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded,
                            color: AppColors.info, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Partner registration in the mobile app is still being developed. '
                            'In the meantime, you can sign up and list your car directly '
                            'on the Sakyan web app — it takes less than 5 minutes!',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? AppColors.textSecondary
                                  : AppColors.textSecondaryLight,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Step-by-step guide ─────────────────────────────────
                  Text(
                    'How to get started',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textSec,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 12),

                  _StepTile(
                    step: 1,
                    icon: Icons.open_in_browser_rounded,
                    title: 'Open the Sakyan Web App',
                    description:
                        'Visit $_kSakyanWebUrl on your phone\'s browser '
                        'or any desktop browser.',
                    isDark: isDark,
                    bgElevated: bgElevated,
                    border: border,
                    textPrim: textPrim,
                    textSec: textSec,
                  ),
                  _StepConnector(isDark: isDark),

                  _StepTile(
                    step: 2,
                    icon: Icons.login_rounded,
                    title: 'Log In with Google',
                    description:
                        'Tap "Sign in with Google" and use the same Google '
                        'account you use in this app — your profile syncs automatically.',
                    isDark: isDark,
                    bgElevated: bgElevated,
                    border: border,
                    textPrim: textPrim,
                    textSec: textSec,
                  ),
                  _StepConnector(isDark: isDark),

                  _StepTile(
                    step: 3,
                    icon: Icons.how_to_reg_rounded,
                    title: 'Choose "Become a Partner"',
                    description:
                        'Go to your Profile on the web app and tap '
                        '"Become a Partner" to start the partner registration.',
                    isDark: isDark,
                    bgElevated: bgElevated,
                    border: border,
                    textPrim: textPrim,
                    textSec: textSec,
                  ),
                  _StepConnector(isDark: isDark),

                  _StepTile(
                    step: 4,
                    icon: Icons.edit_document,
                    title: 'Fill Out the Start Listing Form',
                    description:
                        'Enter your vehicle details, upload photos and required '
                        'documents. Your listing goes live once approved by our team.',
                    isDark: isDark,
                    bgElevated: bgElevated,
                    border: border,
                    textPrim: textPrim,
                    textSec: textSec,
                  ),

                  const SizedBox(height: 24),

                  // ── URL copy row ───────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: bgElevated,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.link_rounded,
                            color: AppColors.primary, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _kSakyanWebUrl,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => _copyUrl(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGlow,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Copy',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── CTA button ─────────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.open_in_browser_rounded,
                          size: 20),
                      label: const Text('Open Sakyan Web App'),
                      onPressed: _openWebApp,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Dismiss
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text('Maybe Later',
                          style: TextStyle(color: textMuted)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step tile ─────────────────────────────────────────────────────────────────
class _StepTile extends StatelessWidget {
  final int step;
  final IconData icon;
  final String title, description;
  final bool isDark;
  final Color bgElevated, border, textPrim, textSec;

  const _StepTile({
    required this.step,
    required this.icon,
    required this.title,
    required this.description,
    required this.isDark,
    required this.bgElevated,
    required this.border,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step number circle
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: AppColors.primaryGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                '$step',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Icon + text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: AppColors.primary, size: 15),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textPrim,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: textSec,
                    height: 1.5,
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

// ── Vertical connector between steps ──────────────────────────────────────────
class _StepConnector extends StatelessWidget {
  final bool isDark;
  const _StepConnector({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 30),
      child: Container(
        width: 2,
        height: 14,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withOpacity(0.5),
              AppColors.primary.withOpacity(0.1),
            ],
          ),
          borderRadius: BorderRadius.circular(1),
        ),
      ),
    );
  }
}

// ── Profile header ─────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  final UserModel? user;
  final bool isDark;
  final Color bgSurface, border, textPrim, textSec;

  const _ProfileHeader({
    required this.user,
    required this.isDark,
    required this.bgSurface,
    required this.border,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    final initials = user?.fullName.isNotEmpty == true
        ? user!.fullName
            .trim()
            .split(' ')
            .map((w) => w[0])
            .take(2)
            .join()
            .toUpperCase()
        : '?';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: isDark ? AppColors.bgElevated : AppColors.borderLight,
                width: 3,
              ),
            ),
            child: user?.avatarUrl.isNotEmpty == true
                ? ClipOval(
                    child: Image.network(user!.avatarUrl, fit: BoxFit.cover))
                : Center(
                    child: Text(
                      initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.fullName ?? 'Loading...',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: textPrim),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  user?.email ?? '',
                  style: TextStyle(fontSize: 13, color: textSec),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGlow,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _roleLabel(user?.role),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
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

  String _roleLabel(String? role) {
    switch (role) {
      case 'partner':
        return '🚗 Partner';
      case 'admin':
        return '⚙️ Admin';
      default:
        return '👤 Customer';
    }
  }
}

// ── Section label ──────────────────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  final String label;
  final Color textSec;
  const _SectionLabel({required this.label, required this.textSec});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 4),
        child: Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: textSec,
            letterSpacing: 1.2,
          ),
        ),
      );
}

// ── Settings card container ────────────────────────────────────────────────
class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  final bool isDark;
  final Color bgSurface, border;

  const _SettingsCard({
    required this.children,
    required this.isDark,
    required this.bgSurface,
    required this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: children),
    );
  }
}

// ── Static info tile ───────────────────────────────────────────────────────
class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final bool isDark;
  final Color textPrim, textSec;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.value,
    required this.isDark,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isDark ? AppColors.bgElevated : AppColors.bgElevatedLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: textPrim)),
          ),
          if (value != null)
            Text(value!, style: TextStyle(fontSize: 13, color: textSec)),
        ],
      ),
    );
  }
}

// ── Navigable tile ─────────────────────────────────────────────────────────
class _SettingsNavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Color? iconColor;
  final Color? labelColor;
  final VoidCallback onTap;
  final bool isDark;
  final Color textPrim, textSec;

  const _SettingsNavTile({
    required this.icon,
    required this.label,
    this.subtitle,
    this.iconColor,
    this.labelColor,
    required this.onTap,
    required this.isDark,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    final ic = iconColor ?? AppColors.primary;
    final lc = labelColor ?? textPrim;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: ic.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: ic, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: lc)),
                  if (subtitle != null)
                    Text(subtitle!,
                        style: TextStyle(fontSize: 12, color: textSec)),
                ],
              ),
            ),
            if (labelColor == null)
              Icon(Icons.chevron_right_rounded, color: textSec, size: 20),
          ],
        ),
      ),
    );
  }
}

// ── Thin divider ───────────────────────────────────────────────────────────
class _Divider extends StatelessWidget {
  final Color color;
  const _Divider({required this.color});

  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, thickness: 1, color: color, indent: 66);
}

// ── KYC status-aware card ─────────────────────────────────────────────────────
class _KycStatusCard extends StatelessWidget {
  final AsyncValue<dynamic> kycAsync;
  final bool isDark;
  final Color bgSurface, border, textPrim, textSec;

  const _KycStatusCard({
    required this.kycAsync,
    required this.isDark,
    required this.bgSurface,
    required this.border,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return kycAsync.when(
      loading: () => _buildShell(
        context,
        icon:      Icons.verified_user_rounded,
        iconColor: AppColors.primary,
        label:     'KYC Verification',
        subtitle:  'Checking status…',
        badgeText:  null,
        badgeColor: null,
        onTap:     null,
      ),
      error: (_, __) => _buildShell(
        context,
        icon:      Icons.verified_user_rounded,
        iconColor: AppColors.primary,
        label:     'KYC Verification',
        subtitle:  'Submit your ID for verification',
        badgeText:  null,
        badgeColor: null,
        onTap:     () => context.push(AppRoutes.kycVerify),
      ),
      data: (kyc) {
        final status = kyc?.status ?? 'not_submitted';
        switch (status) {
          case 'approved':
            return _buildShell(
              context,
              icon:       Icons.verified_rounded,
              iconColor:  AppColors.success,
              label:      'Identity Verified',
              subtitle:   'Your account is fully verified',
              badgeText:  'Verified',
              badgeColor: AppColors.success,
              onTap:      null,
            );
          case 'pending':
            return _buildShell(
              context,
              icon:       Icons.hourglass_top_rounded,
              iconColor:  AppColors.warning,
              label:      'Verification Pending',
              subtitle:   'Your documents are under review',
              badgeText:  'Pending',
              badgeColor: AppColors.warning,
              onTap:      () => context.push(AppRoutes.kycPending),
            );
          case 'rejected':
            return _buildShell(
              context,
              icon:       Icons.gpp_bad_rounded,
              iconColor:  AppColors.error,
              label:      'Verification Rejected',
              subtitle:   'Tap to re-submit your documents',
              badgeText:  'Rejected',
              badgeColor: AppColors.error,
              onTap:      () => context.push(AppRoutes.kycVerify),
            );
          default:
            return _buildShell(
              context,
              icon:       Icons.verified_user_rounded,
              iconColor:  AppColors.primary,
              label:      'KYC Verification',
              subtitle:   'Submit your ID to unlock bookings',
              badgeText:  null,
              badgeColor: null,
              onTap:      () => context.push(AppRoutes.kycVerify),
            );
        }
      },
    );
  }

  Widget _buildShell(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String label,
    required String subtitle,
    required String? badgeText,
    required Color? badgeColor,
    required VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: textPrim)),
                    Text(subtitle,
                        style: TextStyle(fontSize: 12, color: textSec)),
                  ],
                ),
              ),
              if (badgeText != null && badgeColor != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: badgeColor.withOpacity(0.4)),
                  ),
                  child: Text(
                    badgeText,
                    style: TextStyle(
                        color: badgeColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700),
                  ),
                )
              else if (onTap != null)
                Icon(Icons.chevron_right_rounded, color: textSec, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
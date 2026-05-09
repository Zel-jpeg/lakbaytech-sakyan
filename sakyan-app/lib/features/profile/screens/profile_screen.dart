import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/theme/theme_provider.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user      = ref.watch(currentUserProvider);
    final isDark    = ref.watch(isDarkModeProvider);
    final colorScheme = Theme.of(context).colorScheme;

    // Adaptive colours that work in both light and dark
    final bgSurface  = isDark ? AppColors.bgSurface  : AppColors.bgSurfaceLight;
    final bgElevated = isDark ? AppColors.bgElevated : AppColors.bgElevatedLight;
    final border     = isDark ? AppColors.border      : AppColors.borderLight;
    final textPrim   = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final textSec    = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          // Quick theme toggle in AppBar
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
          // ── Avatar + Name ──────────────────────────────────────────
          _ProfileHeader(user: user, isDark: isDark, bgSurface: bgSurface, border: border, textPrim: textPrim, textSec: textSec),
          const SizedBox(height: 24),

          // ── Account section ────────────────────────────────────────
          _SectionLabel(label: 'Account', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
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
          ]),
          const SizedBox(height: 20),

          // ── KYC section (customer only) ────────────────────────────
          if (user?.isCustomer == true) ...[
            _SectionLabel(label: 'Verification', textSec: textSec),
            const SizedBox(height: 8),
            _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
              _SettingsNavTile(
                icon: Icons.verified_user_rounded,
                label: 'KYC Verification',
                subtitle: 'Submit your ID for verification',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () => context.push(AppRoutes.kycVerify),
              ),
            ]),
            const SizedBox(height: 20),
          ],

          // ── Partner section ────────────────────────────────────────
          if (user?.isCustomer == true) ...[
            _SectionLabel(label: 'Earn with Sakyan', textSec: textSec),
            const SizedBox(height: 8),
            _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
              _SettingsNavTile(
                icon: Icons.directions_car_rounded,
                label: 'Become a Partner',
                subtitle: 'List your car and start earning',
                isDark: isDark,
                textPrim: textPrim,
                textSec: textSec,
                onTap: () => context.push(AppRoutes.onboardingStep1),
              ),
            ]),
            const SizedBox(height: 20),
          ],

          // ── Settings section ───────────────────────────────────────
          _SectionLabel(label: 'Settings', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
            // Dark mode toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.dark_mode_rounded, color: AppColors.primary, size: 18),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Dark Mode', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: textPrim)),
                        Text(isDark ? 'Currently dark' : 'Currently light',
                            style: TextStyle(fontSize: 12, color: textSec)),
                      ],
                    ),
                  ),
                  Switch(
                    value: isDark,
                    onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
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
          ]),
          const SizedBox(height: 20),

          // ── About section ──────────────────────────────────────────
          _SectionLabel(label: 'About', textSec: textSec),
          const SizedBox(height: 8),
          _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
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
          ]),
          const SizedBox(height: 20),

          // ── Sign out ───────────────────────────────────────────────
          _SettingsCard(isDark: isDark, bgSurface: bgSurface, border: border, children: [
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
          ]),
        ],
      ),
    );
  }

  String _roleLabel(String? role) {
    switch (role) {
      case 'partner': return 'Partner';
      case 'admin':   return 'Admin';
      default:        return 'Customer';
    }
  }

  Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text(
            'Are you sure you want to sign out?\nYou can sign back in anytime with Google.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    // ── Show a brief loading overlay so the user sees feedback ──────────
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );

    try {
      // signOut() clears storage BEFORE setting state=null so the GoRouter
      // redirect sees no token and stays on /login instead of bouncing back.
      await ref.read(authNotifierProvider.notifier).signOut();
    } catch (_) {
      // Even on error, navigate to login — local state is already cleared.
    }

    // ── Navigate to login immediately; don't rely on redirect alone ──────
    // Using go() replaces the entire stack so the user can't press back.
    if (context.mounted) {
      context.go(AppRoutes.login);
    }
  }
}

// ── Profile header ─────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  final UserModel? user;
  final bool isDark;
  final Color bgSurface, border, textPrim, textSec;
  const _ProfileHeader({
    required this.user, required this.isDark,
    required this.bgSurface, required this.border,
    required this.textPrim, required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    final initials = user?.fullName.isNotEmpty == true
        ? user!.fullName.trim().split(' ').map((w) => w[0]).take(2).join().toUpperCase()
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
          // Avatar
          Container(
            width: 64, height: 64,
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
                ? ClipOval(child: Image.network(user!.avatarUrl, fit: BoxFit.cover))
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
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: textPrim),
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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
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
      case 'partner': return '🚗 Partner';
      case 'admin':   return '⚙️ Admin';
      default:        return '👤 Customer';
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
    required this.children, required this.isDark,
    required this.bgSurface, required this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
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
    required this.icon, required this.label,
    this.value, required this.isDark,
    required this.textPrim, required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: isDark ? AppColors.bgElevated : AppColors.bgElevatedLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textPrim)),
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
    required this.icon, required this.label,
    this.subtitle, this.iconColor, this.labelColor,
    required this.onTap, required this.isDark,
    required this.textPrim, required this.textSec,
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
              width: 36, height: 36,
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
                  Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: lc)),
                  if (subtitle != null)
                    Text(subtitle!, style: TextStyle(fontSize: 12, color: textSec)),
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
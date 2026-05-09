import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

/// Bottom-nav scaffold shown to all authenticated Customer-role users.
class CustomerScaffold extends StatelessWidget {
  final Widget child;
  final int currentIndex;
  final ValueChanged<int> onTabTapped;

  const CustomerScaffold({
    super.key,
    required this.child,
    required this.currentIndex,
    required this.onTabTapped,
  });

  static const _tabs = [
    _TabItem(icon: Icons.home_rounded,           label: 'Home'),
    _TabItem(icon: Icons.directions_car_rounded, label: 'Cars'),
    _TabItem(icon: Icons.receipt_long_rounded,   label: 'Bookings'),
    _TabItem(icon: Icons.person_rounded,         label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: _SakyanBottomNav(
        currentIndex: currentIndex,
        tabs: _tabs,
        onTap: onTabTapped,
      ),
    );
  }
}

/// Bottom-nav scaffold shown to approved Partner-role users.
class PartnerScaffold extends StatelessWidget {
  final Widget child;
  final int currentIndex;
  final ValueChanged<int> onTabTapped;

  const PartnerScaffold({
    super.key,
    required this.child,
    required this.currentIndex,
    required this.onTabTapped,
  });

  static const _tabs = [
    _TabItem(icon: Icons.dashboard_rounded,      label: 'Dashboard'),
    _TabItem(icon: Icons.directions_car_rounded, label: 'My Cars'),
    _TabItem(icon: Icons.receipt_long_rounded,   label: 'Bookings'),
    _TabItem(icon: Icons.chat_bubble_rounded,    label: 'Inbox'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final navBg     = isDark ? AppColors.bgSurface  : AppColors.bgSurfaceLight;
    final navBorder = isDark ? AppColors.border      : AppColors.borderLight;
    final textMuted = isDark ? AppColors.textMuted   : AppColors.textMutedLight;

    return Scaffold(
      body: child,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Polished "Switch to Customer" banner ─────────────────────────
          _CustomerViewBanner(isDark: isDark),
          _SakyanPartnerNav(
            currentIndex: currentIndex,
            tabs: _tabs,
            onTap: onTabTapped,
            navBg: navBg,
            navBorder: navBorder,
            mutedCol: textMuted,
          ),
        ],
      ),
    );
  }
}

// ── Customer View Switch Banner ───────────────────────────────────────────────

class _CustomerViewBanner extends StatelessWidget {
  final bool isDark;
  const _CustomerViewBanner({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final bgColor     = isDark ? const Color(0xFF111827) : const Color(0xFFF0F7FF);
    final borderColor = isDark
        ? AppColors.primary.withOpacity(0.15)
        : AppColors.primary.withOpacity(0.20);

    return GestureDetector(
      onTap: () => context.go('/'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 16),
        decoration: BoxDecoration(
          color: bgColor,
          border: Border(
            top: BorderSide(color: borderColor, width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Left pill icon
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.person_outline_rounded,
                color: AppColors.primary,
                size: 13,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Switch to Customer View',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.1,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 10,
              color: AppColors.primary.withOpacity(0.7),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared bottom nav component ───────────────────────────────────────────────

class _TabItem {
  final IconData icon;
  final String label;
  const _TabItem({required this.icon, required this.label});
}

class _SakyanBottomNav extends StatelessWidget {
  final int currentIndex;
  final List<_TabItem> tabs;
  final ValueChanged<int> onTap;

  const _SakyanBottomNav({
    required this.currentIndex,
    required this.tabs,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return _NavRow(
      currentIndex: currentIndex,
      tabs: tabs,
      onTap: onTap,
      navBg:     isDark ? AppColors.bgSurface  : AppColors.bgSurfaceLight,
      navBorder: isDark ? AppColors.border      : AppColors.borderLight,
      mutedCol:  isDark ? AppColors.textMuted   : AppColors.textMutedLight,
    );
  }
}

class _SakyanPartnerNav extends StatelessWidget {
  final int currentIndex;
  final List<_TabItem> tabs;
  final ValueChanged<int> onTap;
  final Color navBg, navBorder, mutedCol;

  const _SakyanPartnerNav({
    required this.currentIndex,
    required this.tabs,
    required this.onTap,
    required this.navBg,
    required this.navBorder,
    required this.mutedCol,
  });

  @override
  Widget build(BuildContext context) => _NavRow(
        currentIndex: currentIndex,
        tabs: tabs,
        onTap: onTap,
        navBg: navBg,
        navBorder: navBorder,
        mutedCol: mutedCol,
      );
}

class _NavRow extends StatelessWidget {
  final int currentIndex;
  final List<_TabItem> tabs;
  final ValueChanged<int> onTap;
  final Color navBg, navBorder, mutedCol;

  const _NavRow({
    required this.currentIndex,
    required this.tabs,
    required this.onTap,
    required this.navBg,
    required this.navBorder,
    required this.mutedCol,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color:  navBg,
        border: Border(top: BorderSide(color: navBorder, width: 1)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: List.generate(tabs.length, (i) {
              final tab      = tabs[i];
              final selected = i == currentIndex;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                        vertical: 8, horizontal: 4),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primaryGlow : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          tab.icon,
                          size: 22,
                          color: selected ? AppColors.primary : mutedCol,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize:   10,
                            fontWeight: selected
                                ? FontWeight.w600
                                : FontWeight.w400,
                            color: selected ? AppColors.primary : mutedCol,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
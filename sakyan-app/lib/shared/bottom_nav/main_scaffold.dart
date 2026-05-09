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
    _TabItem(icon: Icons.home_rounded,    label: 'Home'),
    _TabItem(icon: Icons.directions_car_rounded, label: 'Cars'),
    _TabItem(icon: Icons.receipt_long_rounded,   label: 'Bookings'),
    _TabItem(icon: Icons.person_rounded,  label: 'Profile'),
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

// ── Shared bottom nav component ──────────────────────────────────────────────

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
    return Container(
      decoration: const BoxDecoration(
        color:  AppColors.bgSurface,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
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
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
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
                          color: selected ? AppColors.primary : AppColors.textMuted,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize:   10,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                            color: selected ? AppColors.primary : AppColors.textMuted,
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

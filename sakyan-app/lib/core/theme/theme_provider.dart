import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

/// Theme mode provider.
///
/// ┌─────────────────────────────────────────────────────────┐
/// │  First install (no saved preference)                    │
/// │    → Defaults to LIGHT mode                            │
/// ├─────────────────────────────────────────────────────────┤
/// │  After first install (saved preference exists)         │
/// │    → Use whatever the user last chose in Profile       │
/// └─────────────────────────────────────────────────────────┘
class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    if (StorageService.hasThemeMode()) {
      final saved = StorageService.getThemeMode();
      return saved == 'dark' ? ThemeMode.dark : ThemeMode.light;
    }

    // ── First install: default to light mode ──────────────────────────────
    StorageService.saveThemeMode('light');
    return ThemeMode.light;
  }

  void toggle() {
    final next = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = next;
    StorageService.saveThemeMode(next == ThemeMode.dark ? 'dark' : 'light');
  }

  void setMode(ThemeMode mode) {
    state = mode;
    StorageService.saveThemeMode(mode == ThemeMode.dark ? 'dark' : 'light');
  }
}

final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

/// Convenience bool — true when dark mode is active.
final isDarkModeProvider = Provider<bool>((ref) {
  return ref.watch(themeModeProvider) == ThemeMode.dark;
});
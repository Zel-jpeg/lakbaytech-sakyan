import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

/// Theme mode provider with smart first-install behaviour:
///
/// ┌─────────────────────────────────────────────────────────┐
/// │  First install (no saved preference)                    │
/// │    → Read system brightness (phone's dark/light mode)  │
/// │    → Save it so next launch is consistent              │
/// ├─────────────────────────────────────────────────────────┤
/// │  After first install (saved preference exists)         │
/// │    → Use whatever the user last chose in Profile       │
/// │    → System brightness is IGNORED from this point on  │
/// └─────────────────────────────────────────────────────────┘
///
/// This gives the UX you want:
///   - New install on a dark-mode phone  → app starts dark
///   - New install on a light-mode phone → app starts light
///   - User toggles theme in Profile     → persisted forever
///   - User changes phone theme later    → ignored (app keeps user's choice)
class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    if (StorageService.hasThemeMode()) {
      // User has already explicitly chosen a theme — respect it.
      final saved = StorageService.getThemeMode();
      return saved == 'dark' ? ThemeMode.dark : ThemeMode.light;
    }

    // ── First install: mirror the phone's current system brightness ───────
    //
    // PlatformDispatcher.instance.platformBrightness works at this point
    // because StorageService.init() is called before runApp(), meaning the
    // widget binding is already initialized and the platform brightness is
    // available synchronously.
    //
    // We deliberately do NOT use ThemeMode.system here because we want the
    // user to be able to override it from Profile without the phone's
    // setting fighting back.
    final systemBrightness =
        WidgetsBinding.instance.platformDispatcher.platformBrightness;
    final initialMode = systemBrightness == Brightness.dark
        ? ThemeMode.dark
        : ThemeMode.light;

    // Persist immediately so the next cold-start doesn't re-check system brightness.
    StorageService.saveThemeMode(
        initialMode == ThemeMode.dark ? 'dark' : 'light');

    return initialMode;
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
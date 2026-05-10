import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

/// Thin wrapper around SharedPreferences for all Sakyan local storage needs.
class StorageService {
  StorageService._();

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get _p {
    assert(_prefs != null, 'StorageService.init() must be called before use');
    return _prefs!;
  }

  // ── Token ─────────────────────────────────────────────────────────────────
  static Future<void> saveToken(String token) =>
      _p.setString(AppConstants.keyToken, token);

  static String? getToken() => _p.getString(AppConstants.keyToken);

  static bool hasToken() =>
      _p.containsKey(AppConstants.keyToken) && getToken() != null;

  static Future<void> removeToken() => _p.remove(AppConstants.keyToken);

  // ── Onboarding ────────────────────────────────────────────────────────────
  static bool hasSeenOnboarding() =>
      _p.getBool(AppConstants.keyOnboardingSeen) ?? false;

  static Future<void> setSeenOnboarding() =>
      _p.setBool(AppConstants.keyOnboardingSeen, true);

  // ── Theme ─────────────────────────────────────────────────────────────────
  /// Returns true only if the user has explicitly set a theme preference.
  /// On a fresh install this is false → ThemeModeNotifier falls back to the
  /// system brightness instead of hardcoding dark mode.
  static bool hasThemeMode() => _p.containsKey(AppConstants.keyThemeMode);

  /// Returns the saved theme string, or null if never set by the user.
  static String? getThemeMode() => _p.getString(AppConstants.keyThemeMode);

  static Future<void> saveThemeMode(String mode) =>
      _p.setString(AppConstants.keyThemeMode, mode);

  // ── FCM Token ─────────────────────────────────────────────────────────────
  static String? getFcmToken() => _p.getString(AppConstants.keyFcmToken);

  static Future<void> saveFcmToken(String token) =>
      _p.setString(AppConstants.keyFcmToken, token);

  // ── Clear auth (sign-out) ─────────────────────────────────────────────────
  /// Clears all data tied to a specific user account:
  ///   • Bearer token (the most important — used by the router guard)
  ///   • Cached user JSON
  ///   • FCM device token — the next user should register a fresh token
  ///     so push notifications go to the right account.
  ///
  /// Intentionally PRESERVES:
  ///   • Onboarding flag — the new user shouldn't see the intro again
  ///     just because someone else signed out on the same device.
  ///   • Theme preference — UX continuity on shared devices.
  static Future<void> clearAuth() async {
    await Future.wait([
      _p.remove(AppConstants.keyToken),
      _p.remove(AppConstants.keyUser),
      _p.remove(AppConstants.keyFcmToken), // prevent push notifications leaking to next user
    ]);
  }

  /// Full wipe — used only in development / testing.
  static Future<void> clearAll() => _p.clear();
}
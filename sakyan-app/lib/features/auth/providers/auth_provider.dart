import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/storage_service.dart';
import '../data/auth_repository.dart';
import '../models/user_model.dart';

// ── Repository provider ───────────────────────────────────────────────────────
final authRepositoryProvider =
    Provider<AuthRepository>((_) => const AuthRepository());

// ── Auth notifier ─────────────────────────────────────────────────────────────
class AuthNotifier extends AsyncNotifier<UserModel?> {
  @override
  Future<UserModel?> build() async {
    return _restoreSession();
  }

  Future<UserModel?> _restoreSession() async {
    try {
      return await ref.read(authRepositoryProvider).getMe();
    } catch (_) {
      await StorageService.clearAuth();
      return null;
    }
  }

  /// Trigger Google Sign-In flow.
  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).signInWithGoogle());
  }

  /// Call after the OAuth deep-link callback returns a session.
  Future<void> handleAuthCallback() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).getMe());
  }

  /// Sign out — clears Supabase session, local storage, then sets state to
  /// null so the GoRouter redirect fires and sends the user to /login.
  ///
  /// FIX: Previously the token was still in SharedPreferences for a brief
  /// window after signOut() returned, causing hasToken() to return true
  /// during the redirect check. Now we await clearAuth() explicitly BEFORE
  /// setting state, guaranteeing the redirect sees no token.
  Future<void> signOut() async {
    // 1. Clear local storage first (synchronous check in redirect reads this)
    await StorageService.clearAuth();

    // 2. Sign out from Supabase (revokes server-side session)
    try {
      await ref.read(authRepositoryProvider).signOutSupabaseOnly();
    } catch (_) {
      // Even if Supabase sign-out fails (network issue), local state is
      // already cleared so the user is effectively logged out locally.
    }

    // 3. Set state to null → triggers GoRouter redirect via ref.listen
    state = const AsyncValue.data(null);
  }

  /// Refresh user data (e.g. after KYC approval, role change).
  Future<void> refresh() async {
    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).getMe());
  }
}

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, UserModel?>(() => AuthNotifier());

// ── Convenience selector providers ───────────────────────────────────────────

/// Returns the current user or null — does not expose loading/error state.
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authNotifierProvider).value;
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider) != null;
});

final isPartnerProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider)?.isPartner ?? false;
});
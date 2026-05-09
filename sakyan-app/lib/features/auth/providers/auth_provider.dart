import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/storage_service.dart';
import '../data/auth_repository.dart';
import '../models/user_model.dart';

// ── Repository provider ───────────────────────────────────────────────────────
final authRepositoryProvider = Provider<AuthRepository>((_) => const AuthRepository());

// ── Auth notifier ─────────────────────────────────────────────────────────────
class AuthNotifier extends AsyncNotifier<UserModel?> {
  @override
  Future<UserModel?> build() async {
    // On startup, try to restore session from stored token
    return _restoreSession();
  }

  Future<UserModel?> _restoreSession() async {
    try {
      return await ref.read(authRepositoryProvider).getMe();
    } catch (_) {
      await StorageService.clearAuth(); // 👈 only this line is added
      return null;
    }
  }

  /// Trigger Google Sign-In flow.
  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      return ref.read(authRepositoryProvider).signInWithGoogle();
    });
  }

  /// Call after the OAuth deep-link callback returns a session.
  Future<void> handleAuthCallback() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      return ref.read(authRepositoryProvider).getMe();
    });
  }

  /// Sign out the user.
  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).signOut();
    state = const AsyncValue.data(null);
  }

  /// Refresh user data (e.g. after KYC approval, role change).
  Future<void> refresh() async {
    state = await AsyncValue.guard(() async {
      return ref.read(authRepositoryProvider).getMe();
    });
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

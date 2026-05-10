import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/storage_service.dart';
import '../data/auth_repository.dart';
import '../models/user_model.dart';

// ── User-specific providers that MUST be wiped on every sign-out ─────────────
// Importing them here is intentional: auth_provider is the single place
// responsible for "session start" and "session end". Keeping the invalidation
// list here makes it impossible to forget a new provider later — you just add
// one line to _invalidateUserCache().
import '../../booking/providers/booking_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../kyc/providers/kyc_provider.dart';
import '../../messages/providers/message_provider.dart';
import '../../partner/providers/partner_provider.dart';
import '../../cars/providers/cars_provider.dart';
import '../../home/providers/home_provider.dart';

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

  // ── Sign in ──────────────────────────────────────────────────────────────
  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).signInWithGoogle());
  }

  /// Called after the OAuth deep-link callback returns a session.
  /// Wipes any stale cache from a previous session first so the new
  /// user never sees another account's data.
  Future<void> handleAuthCallback() async {
    state = const AsyncValue.loading();

    // Purge any data left over from a previously logged-in account
    // before we fetch the new user's profile.
    _invalidateUserCache();

    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).getMe());
  }

  // ── Sign out ─────────────────────────────────────────────────────────────
  ///
  /// ORDER MATTERS:
  ///   1. Clear SharedPreferences — the GoRouter redirect check is
  ///      synchronous (hasToken()), so this must happen first.
  ///   2. Wipe all Riverpod provider caches — must happen while `ref`
  ///      is still valid (i.e. before we set state to null and the
  ///      notifier might be disposed).
  ///   3. Revoke the Supabase server-side session (network call, can fail).
  ///   4. Set auth state to null — triggers GoRouter redirect to /login.
  ///
  Future<void> signOut() async {
    // ── Step 1: Clear local storage ────────────────────────────────────────
    await StorageService.clearAuth();

    // ── Step 2: Purge all in-memory Riverpod caches ────────────────────────
    // Without this, the next user who logs in would instantly see the
    // previous account's bookings, notifications, messages, partner data,
    // KYC status, etc., until each provider individually refreshed.
    _invalidateUserCache();

    // ── Step 3: Revoke Supabase session (best-effort) ──────────────────────
    try {
      await ref.read(authRepositoryProvider).signOutSupabaseOnly();
    } catch (_) {
      // Network failure during sign-out is acceptable — local state is
      // already clean, so the user is effectively logged out on this device.
    }

    // ── Step 4: Set auth state → triggers GoRouter redirect to /login ───────
    state = const AsyncValue.data(null);
  }

  // ── Refresh (e.g. after KYC approval or role change) ─────────────────────
  Future<void> refresh() async {
    state = await AsyncValue.guard(
        () => ref.read(authRepositoryProvider).getMe());
  }

  // ── Private: invalidate every provider that holds user-specific data ──────
  //
  // Riverpod's ref.invalidate() marks the provider as stale. The next time
  // a widget watches it, the provider re-runs its build function and fetches
  // fresh data. Providers that are currently not watched are simply reset to
  // their initial state and will re-fetch on next access.
  //
  // DO NOT use ref.read(...).state = ... here — that causes a rebuild while
  // the notifier may already be disposing. ref.invalidate() is safe.
  //
  void _invalidateUserCache() {
    // ── Customer: bookings ────────────────────────────────────────────────
    ref.invalidate(myBookingsProvider);
    ref.invalidate(createBookingProvider);

    // ── Customer: notifications ───────────────────────────────────────────
    ref.invalidate(notificationsProvider);

    // ── Customer: KYC ─────────────────────────────────────────────────────
    ref.invalidate(kycStatusProvider);
    ref.invalidate(submitKycProvider);

    // ── Customer: messages / conversations ────────────────────────────────
    ref.invalidate(conversationsProvider);
    // chatProvider is a Family — invalidate the whole family
    ref.invalidate(chatProvider);

    // ── Partner: profile, stats, cars, bookings ───────────────────────────
    ref.invalidate(partnerProfileProvider);
    ref.invalidate(partnerStatsProvider);
    ref.invalidate(partnerCarsProvider);
    ref.invalidate(partnerBookingsProvider);
    ref.invalidate(bookingActionProvider);
    ref.invalidate(saveCarProvider);
    ref.invalidate(applyPartnerProvider);
    ref.invalidate(toggleAvailabilityProvider);

    // ── Home / public (still refresh so a partner switching to customer
    //    sees the latest public data, not cached data from their session) ──
    ref.invalidate(featuredCarsProvider);
    ref.invalidate(publicStatsProvider);

    // ── Car filters: reset search/filter state left by previous user ───────
    // StateProvider needs direct state assignment, not invalidate().
    ref.read(carFiltersProvider.notifier).state = const CarFilters();
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
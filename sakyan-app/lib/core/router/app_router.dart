import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/cars/screens/cars_list_screen.dart';
import '../../features/cars/screens/car_detail_screen.dart';
import '../../features/booking/screens/checkout_screen.dart';
import '../../features/booking/screens/confirmation_screen.dart';
import '../../features/booking/screens/my_bookings_screen.dart';
import '../../features/kyc/screens/kyc_verification_screen.dart';
import '../../features/kyc/screens/kyc_pending_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/messages/screens/inbox_screen.dart';
import '../../features/messages/screens/chat_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/partner/screens/partner_home_screen.dart';
import '../../features/partner/screens/partner_bookings_screen.dart';
import '../../features/partner/screens/my_cars_screen.dart';
import '../../features/partner/screens/add_car_screen.dart';
import '../../features/partner/screens/edit_car_screen.dart';
import '../../features/partner/screens/earnings_screen.dart';
import '../../features/partner/screens/partner_inbox_screen.dart';
import '../../features/partner/screens/partner_onboarding/step1_type_screen.dart';
import '../../features/partner/screens/partner_onboarding/step2_info_screen.dart';
import '../../features/partner/screens/partner_onboarding/step3_docs_screen.dart';
import '../../features/partner/screens/partner_onboarding/step4_pending_screen.dart';
import '../../shared/bottom_nav/main_scaffold.dart';
import '../services/storage_service.dart';

// ── Route path constants ───────────────────────────────────────────────────────
class AppRoutes {
  AppRoutes._();

  static const String onboarding = '/onboarding';
  static const String login      = '/login';

  // Customer shell
  static const String home         = '/';
  static const String cars         = '/cars';
  static const String carDetail    = '/cars/:id';
  static const String bookings     = '/bookings';
  static const String profile      = '/profile';

  // Customer extra
  static const String checkout     = '/checkout/:carId';
  static const String confirmation = '/confirmation/:code';
  static const String kycVerify    = '/kyc/verify';
  static const String kycPending   = '/kyc/pending';
  static const String notifications = '/notifications';
  static const String inbox        = '/inbox';
  static const String chat         = '/chat/:bookingId';

  // Partner shell
  static const String partnerHome     = '/partner';
  static const String partnerBookings = '/partner/bookings';
  static const String partnerCars     = '/partner/cars';
  static const String partnerInbox    = '/partner/inbox';

  // Partner extra
  static const String partnerEarnings    = '/partner/earnings';
  static const String addCar             = '/partner/cars/add';
  static const String editCar            = '/partner/cars/:id/edit';

  // Partner onboarding
  static const String onboardingStep1    = '/partner/onboarding/type';
  static const String onboardingStep2    = '/partner/onboarding/info';
  static const String onboardingStep3    = '/partner/onboarding/docs';
  static const String onboardingStep4    = '/partner/onboarding/pending';
}

// ── Stable navigator key (module-level singleton) ─────────────────────────────
final _rootKey = GlobalKey<NavigatorState>();

// ── Router provider — created ONCE, never recreated on theme change ───────────
//
// KEY FIX: Previously createRouter(WidgetRef ref) was called inside
// SakyanApp.build(), so every time themeModeProvider changed the widget
// rebuilt → a brand-new GoRouter was created → initialLocation: '/' fired
// → the user got bounced back to home.
//
// Now the GoRouter lives in a Provider that has NO dependency on themeModeProvider.
// Theme changes only rebuild MaterialApp.router (swapping ThemeData), but the
// router instance stays the same → navigation state is preserved.
//
// Auth changes are handled by ref.listen → router.refresh(), which triggers the
// redirect callback without recreating the router.
// ─────────────────────────────────────────────────────────────────────────────
final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',

    redirect: (context, state) {
      final isLoggedIn  = StorageService.hasToken();
      final seenOnboard = StorageService.hasSeenOnboarding();
      final path        = state.uri.path;

      // First launch → onboarding
      if (!seenOnboard && path != AppRoutes.onboarding) {
        return AppRoutes.onboarding;
      }

      // Not logged in → login
      if (!isLoggedIn &&
          path != AppRoutes.login &&
          path != AppRoutes.onboarding) {
        return AppRoutes.login;
      }

      // Logged-in user on login page → push to role-appropriate home
      if (isLoggedIn && path == AppRoutes.login) {
        // Use ref.read (not watch) inside the redirect closure
        final user = ref.read(authNotifierProvider).value;
        if (user?.role == 'partner') return AppRoutes.partnerHome;
        return AppRoutes.home;
      }

      return null; // no redirect
    },

    routes: [
      // ── Onboarding ──────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),

      // ── Auth ─────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
      ),

      // ── Customer Shell (Bottom Nav) ──────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) {
          final path = state.uri.path;
          int idx = 0;
          if (path.startsWith(AppRoutes.cars)) idx = 1;
          else if (path.startsWith(AppRoutes.bookings)) idx = 2;
          else if (path.startsWith(AppRoutes.profile)) idx = 3;

          return CustomerScaffold(
            currentIndex: idx,
            onTabTapped: (i) {
              if (i == 0) context.go(AppRoutes.home);
              else if (i == 1) context.go(AppRoutes.cars);
              else if (i == 2) context.go(AppRoutes.bookings);
              else if (i == 3) context.go(AppRoutes.profile);
            },
            child: child,
          );
        },
        routes: [
          GoRoute(path: AppRoutes.home, builder: (_, __) => const HomeScreen()),
          GoRoute(
            path: AppRoutes.cars,
            builder: (_, __) => const CarsListScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (_, s) =>
                    CarDetailScreen(carId: s.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
              path: AppRoutes.bookings,
              builder: (_, __) => const MyBookingsScreen()),
          GoRoute(
              path: AppRoutes.profile,
              builder: (_, __) => const ProfileScreen()),
        ],
      ),

      // ── Partner Shell (Bottom Nav) ────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) {
          final path = state.uri.path;
          int idx = 0;
          if (path.startsWith(AppRoutes.partnerCars)) idx = 1;
          else if (path.startsWith(AppRoutes.partnerBookings)) idx = 2;
          else if (path.startsWith(AppRoutes.partnerInbox)) idx = 3;

          return PartnerScaffold(
            currentIndex: idx,
            onTabTapped: (i) {
              if (i == 0) context.go(AppRoutes.partnerHome);
              else if (i == 1) context.go(AppRoutes.partnerCars);
              else if (i == 2) context.go(AppRoutes.partnerBookings);
              else if (i == 3) context.go(AppRoutes.partnerInbox);
            },
            child: child,
          );
        },
        routes: [
          GoRoute(
              path: AppRoutes.partnerHome,
              builder: (_, __) => const PartnerHomeScreen()),
          GoRoute(
              path: AppRoutes.partnerCars,
              builder: (_, __) => const MyCarsScreen()),
          GoRoute(
              path: AppRoutes.partnerBookings,
              builder: (_, __) => const PartnerBookingsScreen()),
          GoRoute(
              path: AppRoutes.partnerInbox,
              builder: (_, __) => const PartnerInboxScreen()),
        ],
      ),

      // ── Standalone screens (no shell) ─────────────────────────────────────
      GoRoute(
        path: '/checkout/:carId',
        builder: (_, s) =>
            CheckoutScreen(carId: s.pathParameters['carId']!),
      ),
      GoRoute(
        path: '/confirmation/:code',
        builder: (_, s) =>
            ConfirmationScreen(bookingCode: s.pathParameters['code']!),
      ),
      GoRoute(
          path: AppRoutes.kycVerify,
          builder: (_, __) => const KycVerificationScreen()),
      GoRoute(
          path: AppRoutes.kycPending,
          builder: (_, __) => const KycPendingScreen()),
      GoRoute(
          path: AppRoutes.notifications,
          builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: AppRoutes.inbox, builder: (_, __) => const InboxScreen()),
      GoRoute(
        path: '/chat/:bookingId',
        builder: (_, s) =>
            ChatScreen(bookingId: s.pathParameters['bookingId']!),
      ),
      GoRoute(
          path: AppRoutes.partnerEarnings,
          builder: (_, __) => const EarningsScreen()),
      GoRoute(
          path: AppRoutes.addCar, builder: (_, __) => const AddCarScreen()),
      GoRoute(
        path: '/partner/cars/:id/edit',
        builder: (_, s) =>
            EditCarScreen(carId: s.pathParameters['id']!),
      ),

      // Partner onboarding wizard
      GoRoute(
          path: AppRoutes.onboardingStep1,
          builder: (_, __) => const Step1TypeScreen()),
      GoRoute(
          path: AppRoutes.onboardingStep2,
          builder: (_, __) => const Step2InfoScreen()),
      GoRoute(
          path: AppRoutes.onboardingStep3,
          builder: (_, __) => const Step3DocsScreen()),
      GoRoute(
          path: AppRoutes.onboardingStep4,
          builder: (_, __) => const Step4PendingScreen()),
    ],
  );

  // ── Refresh router when auth state changes ─────────────────────────────────
  // This triggers the redirect callback so role-based routing stays in sync,
  // WITHOUT recreating the router (navigation state is preserved).
  ref.listen<AsyncValue<dynamic>>(authNotifierProvider, (_, __) {
    router.refresh();
  });

  return router;
});
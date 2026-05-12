import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'features/booking/providers/booking_provider.dart';

class SakyanApp extends ConsumerWidget {
  const SakyanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router    = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title:                      'Sakyan',
      debugShowCheckedModeBanner: false,
      theme:                      AppTheme.light,
      darkTheme:                  AppTheme.dark,
      themeMode:                  themeMode,
      routerConfig:               router,

      // ── Global messenger key — used by BookingToastService ────────────────
      //
      // Attach the key here so BookingToastService.show() can display
      // SnackBars from anywhere (providers, background poll timers)
      // without needing a BuildContext.
      //
      scaffoldMessengerKey: BookingToastService.messengerKey,
    );
  }
}
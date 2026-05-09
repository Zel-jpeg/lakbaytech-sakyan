import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';

class SakyanApp extends ConsumerWidget {
  const SakyanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ── CRITICAL: use ref.watch(appRouterProvider) NOT createRouter(ref) ────
    //
    // appRouterProvider is a stable Provider<GoRouter> — it is created ONCE
    // for the lifetime of the ProviderScope and never recreated.
    //
    // Previously createRouter(ref) was called here directly, which meant any
    // rebuild of SakyanApp (e.g. theme toggle) created a brand-new GoRouter
    // with initialLocation: '/', bouncing the user back to home.
    //
    // Now only themeModeProvider triggers a rebuild (to swap ThemeData), but
    // the router instance is unchanged → navigation state is preserved.
    // ────────────────────────────────────────────────────────────────────────
    final router    = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title:                      'Sakyan',
      debugShowCheckedModeBanner: false,
      theme:                      AppTheme.light,
      darkTheme:                  AppTheme.dark,
      themeMode:                  themeMode,
      routerConfig:               router,
    );
  }
}
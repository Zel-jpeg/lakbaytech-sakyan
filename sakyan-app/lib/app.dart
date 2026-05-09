import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';

class SakyanApp extends ConsumerWidget {
  const SakyanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router    = createRouter(ref);
    final themeMode = ref.watch(themeModeProvider); // ← reads saved preference

    return MaterialApp.router(
      title:                      'Sakyan',
      debugShowCheckedModeBanner: false,
      theme:                      AppTheme.light,
      darkTheme:                  AppTheme.dark,
      themeMode:                  themeMode, // ← no longer hardcoded
      routerConfig:               router,
    );
  }
}
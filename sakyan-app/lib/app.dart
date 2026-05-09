import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

class SakyanApp extends ConsumerWidget {
  const SakyanApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = createRouter(ref);

    return MaterialApp.router(
      title:            'Sakyan',
      debugShowCheckedModeBanner: false,
      theme:            AppTheme.light,
      darkTheme:        AppTheme.dark,
      themeMode:        ThemeMode.dark, // dark by default; toggled by user in Profile
      routerConfig:     router,
    );
  }
}

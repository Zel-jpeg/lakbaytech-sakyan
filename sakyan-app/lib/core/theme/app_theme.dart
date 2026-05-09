import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static const String _fontFamily = 'PlusJakartaSans';

  // ── Dark Theme ───────────────────────────────────────────────────────────────
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: _fontFamily,
      scaffoldBackgroundColor: AppColors.bgBase,
      colorScheme: const ColorScheme.dark(
        primary:          AppColors.primary,
        onPrimary:        Colors.white,
        secondary:        AppColors.bgElevated,
        onSecondary:      AppColors.textPrimary,
        surface:          AppColors.bgSurface,
        onSurface:        AppColors.textPrimary,
        error:            AppColors.error,
        outline:          AppColors.border,
      ),

      // AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor:  AppColors.bgBase,
        foregroundColor:  AppColors.textPrimary,
        elevation:        0,
        scrolledUnderElevation: 0,
        centerTitle:      false,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor:           Colors.transparent,
          statusBarIconBrightness:  Brightness.light,
        ),
        titleTextStyle: TextStyle(
          fontFamily:  _fontFamily,
          fontSize:    18,
          fontWeight:  FontWeight.w600,
          color:       AppColors.textPrimary,
        ),
      ),

      // Card
      cardTheme: CardThemeData(
        color:        AppColors.bgSurface,
        elevation:    0,
        shape:        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
        margin:       EdgeInsets.zero,
      ),

      // Buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor:  AppColors.primary,
          foregroundColor:  Colors.white,
          minimumSize:      const Size(double.infinity, 52),
          shape:            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle:        const TextStyle(fontFamily: _fontFamily, fontSize: 16, fontWeight: FontWeight.w600),
          elevation:        0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor:  AppColors.primary,
          minimumSize:      const Size(double.infinity, 52),
          side:             const BorderSide(color: AppColors.primary, width: 1.5),
          shape:            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle:        const TextStyle(fontFamily: _fontFamily, fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(fontFamily: _fontFamily, fontWeight: FontWeight.w600),
        ),
      ),

      // Input
      inputDecorationTheme: InputDecorationTheme(
        filled:            true,
        fillColor:         AppColors.bgElevated,
        contentPadding:    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border:            OutlineInputBorder(
          borderRadius:    BorderRadius.circular(12),
          borderSide:      const BorderSide(color: AppColors.border),
        ),
        enabledBorder:     OutlineInputBorder(
          borderRadius:    BorderRadius.circular(12),
          borderSide:      const BorderSide(color: AppColors.border),
        ),
        focusedBorder:     OutlineInputBorder(
          borderRadius:    BorderRadius.circular(12),
          borderSide:      const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder:       OutlineInputBorder(
          borderRadius:    BorderRadius.circular(12),
          borderSide:      const BorderSide(color: AppColors.error),
        ),
        hintStyle:         const TextStyle(color: AppColors.textMuted, fontFamily: _fontFamily),
        labelStyle:        const TextStyle(color: AppColors.textSecondary, fontFamily: _fontFamily),
      ),

      // Bottom Navigation
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.bgSurface,
        selectedItemColor:   AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),

      // Chip
      chipTheme: ChipThemeData(
        backgroundColor:  AppColors.bgElevated,
        selectedColor:    AppColors.primaryGlow,
        labelStyle:       const TextStyle(fontFamily: _fontFamily, fontSize: 12),
        side:             const BorderSide(color: AppColors.border),
        shape:            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),

      // Divider
      dividerTheme: const DividerThemeData(color: AppColors.border, space: 1, thickness: 1),

      // Text
      textTheme: _textTheme(AppColors.textPrimary),

      // SnackBar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.bgElevated,
        contentTextStyle: const TextStyle(fontFamily: _fontFamily, color: AppColors.textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.bgSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: const TextStyle(fontFamily: _fontFamily, fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
      ),
    );
  }

  // ── Light Theme ──────────────────────────────────────────────────────────────
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: _fontFamily,
      scaffoldBackgroundColor: AppColors.bgBaseLight,
      colorScheme: const ColorScheme.light(
        primary:      AppColors.primary,
        onPrimary:    Colors.white,
        surface:      AppColors.bgSurfaceLight,
        onSurface:    AppColors.textPrimaryLight,
        error:        AppColors.error,
        outline:      AppColors.borderLight,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgSurfaceLight,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor:          Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
        titleTextStyle: TextStyle(
          fontFamily: _fontFamily,
          fontSize:   18,
          fontWeight: FontWeight.w600,
          color:      AppColors.textPrimaryLight,
        ),
      ),
      cardTheme: CardThemeData(
        color:        AppColors.bgSurfaceLight,
        elevation:    0,
        shape:        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize:     const Size(double.infinity, 52),
          shape:           RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle:       const TextStyle(fontFamily: _fontFamily, fontSize: 16, fontWeight: FontWeight.w600),
          elevation: 0,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled:         true,
        fillColor:      AppColors.bgElevatedLight,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border:         OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
        enabledBorder:  OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
        focusedBorder:  OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
        hintStyle:      const TextStyle(color: AppColors.textSecondaryLight, fontFamily: _fontFamily),
      ),
      textTheme: _textTheme(AppColors.textPrimaryLight),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.textPrimaryLight,
        contentTextStyle: const TextStyle(fontFamily: _fontFamily, color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static TextTheme _textTheme(Color base) {
    return TextTheme(
      displayLarge:  TextStyle(fontFamily: _fontFamily, fontSize: 36, fontWeight: FontWeight.w700, color: base),
      displayMedium: TextStyle(fontFamily: _fontFamily, fontSize: 28, fontWeight: FontWeight.w700, color: base),
      displaySmall:  TextStyle(fontFamily: _fontFamily, fontSize: 24, fontWeight: FontWeight.w700, color: base),
      headlineLarge: TextStyle(fontFamily: _fontFamily, fontSize: 22, fontWeight: FontWeight.w700, color: base),
      headlineMedium:TextStyle(fontFamily: _fontFamily, fontSize: 20, fontWeight: FontWeight.w600, color: base),
      headlineSmall: TextStyle(fontFamily: _fontFamily, fontSize: 18, fontWeight: FontWeight.w600, color: base),
      titleLarge:    TextStyle(fontFamily: _fontFamily, fontSize: 16, fontWeight: FontWeight.w600, color: base),
      titleMedium:   TextStyle(fontFamily: _fontFamily, fontSize: 14, fontWeight: FontWeight.w600, color: base),
      titleSmall:    TextStyle(fontFamily: _fontFamily, fontSize: 12, fontWeight: FontWeight.w600, color: base),
      bodyLarge:     TextStyle(fontFamily: _fontFamily, fontSize: 16, fontWeight: FontWeight.w400, color: base),
      bodyMedium:    TextStyle(fontFamily: _fontFamily, fontSize: 14, fontWeight: FontWeight.w400, color: base),
      bodySmall:     TextStyle(fontFamily: _fontFamily, fontSize: 12, fontWeight: FontWeight.w400, color: base),
      labelLarge:    TextStyle(fontFamily: _fontFamily, fontSize: 14, fontWeight: FontWeight.w500, color: base),
      labelMedium:   TextStyle(fontFamily: _fontFamily, fontSize: 12, fontWeight: FontWeight.w500, color: base),
      labelSmall:    TextStyle(fontFamily: _fontFamily, fontSize: 10, fontWeight: FontWeight.w500, color: base),
    );
  }
}

import 'package:flutter/material.dart';

/// Sakyan color tokens — mirrors the web frontend's Tailwind palette.
/// Light: clean white + blue-600 brand.
/// Dark:  #0f1117 base (matches web index.css exactly) + blue-500 brand.
class AppColors {
  AppColors._();

  // ── Brand (blue) ─────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF2563EB); // blue-600
  static const Color primaryDark  = Color(0xFF1D4ED8); // blue-700
  static const Color primaryLight = Color(0xFF3B82F6); // blue-500
  static const Color primaryGlow  = Color(0x332563EB); // blue-600 @ 20 %

  static const List<Color> primaryGradient = [Color(0xFF2563EB), Color(0xFF1D4ED8)];

  // ── Dark-mode backgrounds (matches web #0f1117 / #1a1d2e) ────────────────
  static const Color bgBase     = Color(0xFF0F1117); // deepest bg
  static const Color bgSurface  = Color(0xFF1A1D2E); // card bg  ← web card
  static const Color bgElevated = Color(0xFF232640); // elevated card / modal
  static const Color bgSubtle   = Color(0xFF2D3155); // subtle highlight

  // ── Dark-mode borders ─────────────────────────────────────────────────────
  static const Color border       = Color(0xFF1F2937); // gray-800
  static const Color borderSubtle = Color(0xFF374151); // gray-700

  // ── Dark-mode text ────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFF3F4F6); // gray-100
  static const Color textSecondary = Color(0xFF9CA3AF); // gray-400
  static const Color textMuted     = Color(0xFF6B7280); // gray-500
  static const Color textInverse   = Color(0xFF111827); // gray-900

  // ── Light-mode backgrounds ────────────────────────────────────────────────
  static const Color bgBaseLight     = Color(0xFFF9FAFB); // gray-50
  static const Color bgSurfaceLight  = Color(0xFFFFFFFF); // white
  static const Color bgElevatedLight = Color(0xFFF3F4F6); // gray-100
  static const Color bgSubtleLight   = Color(0xFFEFF6FF); // blue-50

  // ── Light-mode borders ────────────────────────────────────────────────────
  static const Color borderLight       = Color(0xFFE5E7EB); // gray-200
  static const Color borderSubtleLight = Color(0xFFD1D5DB); // gray-300

  // ── Light-mode text ───────────────────────────────────────────────────────
  static const Color textPrimaryLight   = Color(0xFF111827); // gray-900
  static const Color textSecondaryLight = Color(0xFF6B7280); // gray-500
  static const Color textMutedLight     = Color(0xFF9CA3AF); // gray-400

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success  = Color(0xFF10B981);
  static const Color warning  = Color(0xFFF59E0B);
  static const Color error    = Color(0xFFEF4444);
  static const Color info     = Color(0xFF3B82F6);

  static const Color successBg = Color(0x1A10B981);
  static const Color warningBg = Color(0x1AF59E0B);
  static const Color errorBg   = Color(0x1AEF4444);
  static const Color infoBg    = Color(0x1A3B82F6);

  // ── Booking status ────────────────────────────────────────────────────────
  static const Color statusPending   = Color(0xFFF59E0B);
  static const Color statusApproved  = Color(0xFF10B981);
  static const Color statusRejected  = Color(0xFFEF4444);
  static const Color statusActive    = Color(0xFF3B82F6);
  static const Color statusCompleted = Color(0xFF8B5CF6);
  static const Color statusCancelled = Color(0xFF6B7280);
}
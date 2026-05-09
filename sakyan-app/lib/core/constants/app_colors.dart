// App color design tokens — dark mode first
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Backgrounds ──────────────────────────────────────────────────────────────
  static const Color bgBase     = Color(0xFF0A0F1E); // deepest bg
  static const Color bgSurface  = Color(0xFF111827); // card bg
  static const Color bgElevated = Color(0xFF1C2333); // elevated card / modal
  static const Color bgSubtle   = Color(0xFF243044); // subtle highlight

  // ── Brand / Accent ───────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFFFF4D1C); // Sakyan orange-red
  static const Color primaryDark  = Color(0xFFD93A10);
  static const Color primaryLight = Color(0xFFFF6B47);
  static const Color primaryGlow  = Color(0x33FF4D1C); // glow / shadow tint

  // Gradient stops
  static const List<Color> primaryGradient = [Color(0xFFFF4D1C), Color(0xFFD93A10)];

  // ── Text ─────────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted     = Color(0xFF6B7280);
  static const Color textInverse   = Color(0xFF0A0F1E);

  // ── Border / Divider ─────────────────────────────────────────────────────────
  static const Color border       = Color(0xFF1F2A40);
  static const Color borderSubtle = Color(0xFF374151);

  // ── Semantic ─────────────────────────────────────────────────────────────────
  static const Color success  = Color(0xFF10B981);
  static const Color warning  = Color(0xFFF59E0B);
  static const Color error    = Color(0xFFEF4444);
  static const Color info     = Color(0xFF3B82F6);

  static const Color successBg = Color(0x1A10B981);
  static const Color warningBg = Color(0x1AF59E0B);
  static const Color errorBg   = Color(0x1AEF4444);
  static const Color infoBg    = Color(0x1A3B82F6);

  // ── Booking Status ───────────────────────────────────────────────────────────
  static const Color statusPending   = Color(0xFFF59E0B);
  static const Color statusApproved  = Color(0xFF10B981);
  static const Color statusRejected  = Color(0xFFEF4444);
  static const Color statusActive    = Color(0xFF3B82F6);
  static const Color statusCompleted = Color(0xFF8B5CF6);
  static const Color statusCancelled = Color(0xFF6B7280);

  // Light-mode counterparts
  static const Color bgBaseLight     = Color(0xFFF9FAFB);
  static const Color bgSurfaceLight  = Color(0xFFFFFFFF);
  static const Color bgElevatedLight = Color(0xFFF3F4F6);
  static const Color textPrimaryLight = Color(0xFF111827);
  static const Color textSecondaryLight = Color(0xFF6B7280);
  static const Color borderLight      = Color(0xFFE5E7EB);
}

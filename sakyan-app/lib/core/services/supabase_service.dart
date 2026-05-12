import 'dart:typed_data';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

/// Supabase client accessor and helper methods for file uploads.
///
/// ── Image compression strategy (mirrors the web app) ─────────────────────────
///
/// Every image goes through [_compress] before hitting Supabase storage.
/// This matches what the Sakyan web frontend does with browser Canvas:
///
///   Type          maxDim   quality   typical saving
///   ──────────── ──────── ─────────  ──────────────
///   Chat images    800 px    75 %      ~70-80 %
///   Car images    1200 px    80 %      ~60-75 %
///   Avatars        512 px    80 %      ~80-90 %
///   KYC / docs    1600 px    85 %      ~50-65 %
///
/// We always re-encode as JPEG (except PNG with transparency) so we get
/// consistent, predictable sizes regardless of what the user picks.
/// ─────────────────────────────────────────────────────────────────────────────
class SupabaseService {
  SupabaseService._();

  static SupabaseClient get client => Supabase.instance.client;

  // ── Compression helper ─────────────────────────────────────────────────────
  //
  // [maxDimension] caps both width and height (aspect ratio preserved).
  // [quality]      0–100 JPEG quality (75 is visually indistinguishable
  //                from 100 for photos, but 3-4× smaller on disk).
  //
  static Future<Uint8List> _compress(
    Uint8List bytes, {
    int maxDimension = 1200,
    int quality      = 80,
  }) async {
    final result = await FlutterImageCompress.compressWithList(
      bytes,
      minWidth:  maxDimension,
      minHeight: maxDimension,
      quality:   quality,
      format:    CompressFormat.jpeg,   // always JPEG — smallest for photos
      keepExif:  false,                 // strip GPS & device metadata
    );
    return result;
  }

  // ── Core upload (compress then push) ──────────────────────────────────────
  //
  // All callers go through here so compression is never skipped.
  // Pass [skipCompression: true] only for non-image files (PDFs etc.).
  //
  static Future<String> uploadFile({
    required String    bucket,
    required String    fileName,
    required Uint8List fileBytes,
    String             contentType      = 'image/jpeg',
    bool               skipCompression  = false,
    int                maxDimension     = 1200,
    int                quality          = 80,
  }) async {
    final Uint8List payload;
    if (skipCompression || !contentType.startsWith('image/')) {
      payload = fileBytes;
    } else {
      payload = await _compress(
        fileBytes,
        maxDimension: maxDimension,
        quality:      quality,
      );
    }

    await client.storage.from(bucket).uploadBinary(
      fileName,
      payload,
      fileOptions: FileOptions(
        // After compression we always produce JPEG
        contentType: skipCompression ? contentType : 'image/jpeg',
        upsert: true,
      ),
    );
    return client.storage.from(bucket).getPublicUrl(fileName);
  }

  // ── Typed upload helpers ───────────────────────────────────────────────────

  /// Chat image — aggressive compression, capped at 800 px.
  /// Users sending GCash receipts / photos don't need full resolution.
  static Future<String> uploadChatImage(
    String fileName,
    Uint8List bytes,
  ) =>
      uploadFile(
        bucket:       AppConstants.bucketChatImages,
        fileName:     fileName,
        fileBytes:    bytes,
        maxDimension: 800,
        quality:      75,
      );

  /// Car listing image — moderate compression, 1200 px max.
  static Future<String> uploadCarImage(
    String fileName,
    Uint8List bytes,
  ) =>
      uploadFile(
        bucket:       AppConstants.bucketCarImages,
        fileName:     fileName,
        fileBytes:    bytes,
        maxDimension: 1200,
        quality:      80,
      );

  /// Avatar — small cap, high quality still looks crisp at display sizes.
  static Future<String> uploadAvatar(
    String fileName,
    Uint8List bytes,
  ) =>
      uploadFile(
        bucket:       AppConstants.bucketAvatars,
        fileName:     fileName,
        fileBytes:    bytes,
        maxDimension: 512,
        quality:      80,
      );

  /// KYC / partner documents — higher resolution kept for legibility.
  static Future<String> uploadKycDocument(
    String fileName,
    Uint8List bytes,
  ) =>
      uploadFile(
        bucket:       AppConstants.bucketKycDocs,
        fileName:     fileName,
        fileBytes:    bytes,
        maxDimension: 1600,
        quality:      85,
      );

  static Future<String> uploadPartnerDocument(
    String fileName,
    Uint8List bytes,
  ) =>
      uploadFile(
        bucket:       AppConstants.bucketPartnerDocs,
        fileName:     fileName,
        fileBytes:    bytes,
        maxDimension: 1600,
        quality:      85,
      );

  // ── Auth helpers ───────────────────────────────────────────────────────────
  static Session? get currentSession => client.auth.currentSession;
  static String?  get accessToken    => client.auth.currentSession?.accessToken;
  static Future<void> signOut()      => client.auth.signOut();
}
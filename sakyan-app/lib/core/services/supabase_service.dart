import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

/// Supabase client accessor and helper methods for file uploads.
class SupabaseService {
  SupabaseService._();

  /// Call once after Supabase.initialize() in main().
  static SupabaseClient get client => Supabase.instance.client;

  // ── File Upload Helpers ────────────────────────────────────────────────────

  /// Upload a local file to a Supabase storage bucket.
  /// Returns the public URL of the uploaded file.
  static Future<String> uploadFile({
    required String bucket,
    required String fileName,
    required Uint8List fileBytes,
    String contentType = 'image/jpeg',
  }) async {
    await client.storage.from(bucket).uploadBinary(
      fileName,
      fileBytes,
      fileOptions: FileOptions(contentType: contentType, upsert: true),
    );
    return client.storage.from(bucket).getPublicUrl(fileName);
  }

  /// Upload a car image. Returns the public URL.
  static Future<String> uploadCarImage(String fileName, Uint8List bytes) =>
      uploadFile(bucket: AppConstants.bucketCarImages, fileName: fileName, fileBytes: bytes);

  /// Upload a KYC document (license, ID, selfie). Returns the public URL.
  static Future<String> uploadKycDocument(String fileName, Uint8List bytes) =>
      uploadFile(bucket: AppConstants.bucketKycDocs, fileName: fileName, fileBytes: bytes);

  /// Upload a partner document (gov ID, business permit). Returns public URL.
  static Future<String> uploadPartnerDocument(String fileName, Uint8List bytes) =>
      uploadFile(bucket: AppConstants.bucketPartnerDocs, fileName: fileName, fileBytes: bytes);

  /// Upload an avatar image. Returns the public URL.
  static Future<String> uploadAvatar(String fileName, Uint8List bytes) =>
      uploadFile(bucket: AppConstants.bucketAvatars, fileName: fileName, fileBytes: bytes);

  // ── Auth helpers ──────────────────────────────────────────────────────────
  static Session? get currentSession => client.auth.currentSession;
  static String?  get accessToken    => client.auth.currentSession?.accessToken;

  static Future<void> signOut() => client.auth.signOut();
}

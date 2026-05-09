import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../../../core/services/api_service.dart';
import '../models/kyc_model.dart';

class KycRepository {
  const KycRepository();

  static final _storage = Supabase.instance.client.storage;
  static const _bucket  = 'kyc-documents';
  static const _uuid    = Uuid();

  // ── Upload a file to Supabase Storage and return the public URL ────────────
  Future<String> _uploadFile(File file, String folder) async {
    final ext      = file.path.split('.').last;
    final fileName = '$folder/${_uuid.v4()}.$ext';
    await _storage.from(_bucket).upload(fileName, file);
    return _storage.from(_bucket).getPublicUrl(fileName);
  }

  // ── Upload all three KYC documents and POST to Django ─────────────────────
  Future<KycModel> submitKyc({
    required File licenseFile,
    required File validIdFile,
    required File selfieFile,
  }) async {
    // Upload to Supabase Storage in parallel
    final results = await Future.wait([
      _uploadFile(licenseFile, 'license'),
      _uploadFile(validIdFile, 'valid_id'),
      _uploadFile(selfieFile,  'selfie'),
    ]);

    final res = await ApiService.post('/bookings/kyc/', data: {
      'license_url':  results[0],
      'valid_id_url': results[1],
      'selfie_url':   results[2],
    });
    return KycModel.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Fetch current KYC status ───────────────────────────────────────────────
  Future<KycModel?> getKycStatus() async {
    try {
      final res = await ApiService.get('/customer/kyc/');
      return KycModel.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }
}
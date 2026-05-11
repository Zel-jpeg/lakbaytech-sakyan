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

  // ── Upload documents and POST all KYC data to Django ──────────────────────
  /// Matches exactly what the web (KYCVerificationPage) sends:
  ///   - Step 1: birthday, contact_number, address, address_lat, address_lng
  ///   - Step 2: drivers_license_number, license_expiry, valid_id_type
  ///   - Step 3: drivers_license_url, valid_id_url  (uploaded files)
  Future<KycModel> submitKyc({
    // Step 1 — personal info
    required String birthday,
    required String contactNumber,
    required String address,
    double? addressLat,
    double? addressLng,
    // Step 2 — license & ID details
    required String driversLicenseNumber,
    required String licenseExpiry,
    required String validIdType,
    // Step 3 — document files
    required File licenseFile,
    required File validIdFile,
  }) async {
    // Upload to Supabase Storage in parallel
    final results = await Future.wait([
      _uploadFile(licenseFile, 'license'),
      _uploadFile(validIdFile, 'valid_id'),
    ]);

    final res = await ApiService.post('/bookings/kyc/', data: {
      'birthday':               birthday,
      'contact_number':         contactNumber,
      'address':                address,
      if (addressLat != null) 'address_lat': addressLat,
      if (addressLng != null) 'address_lng': addressLng,
      'drivers_license_number': driversLicenseNumber,
      'license_expiry':         licenseExpiry,
      'valid_id_type':          validIdType,
      'drivers_license_url':    results[0],
      'valid_id_url':           results[1],
    });
    return KycModel.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Fetch current KYC status ───────────────────────────────────────────────
  Future<KycModel?> getKycStatus() async {
    try {
      final res = await ApiService.get('/customer/kyc/');
      final data = res.data;
      if (data is Map<String, dynamic>) {
        return KycModel.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
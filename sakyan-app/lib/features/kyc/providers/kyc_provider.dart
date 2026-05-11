import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/kyc_repository.dart';
import '../models/kyc_model.dart';

final kycRepositoryProvider =
    Provider<KycRepository>((_) => const KycRepository());

// ── Current KYC status ────────────────────────────────────────────────────────
final kycStatusProvider = FutureProvider<KycModel?>((ref) async {
  return ref.read(kycRepositoryProvider).getKycStatus();
});

// ── Submit KYC notifier ───────────────────────────────────────────────────────
class SubmitKycNotifier extends AsyncNotifier<KycModel?> {
  @override
  Future<KycModel?> build() async => null;

  Future<KycModel?> submit({
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
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(kycRepositoryProvider).submitKyc(
          birthday:               birthday,
          contactNumber:          contactNumber,
          address:                address,
          addressLat:             addressLat,
          addressLng:             addressLng,
          driversLicenseNumber:   driversLicenseNumber,
          licenseExpiry:          licenseExpiry,
          validIdType:            validIdType,
          licenseFile:            licenseFile,
          validIdFile:            validIdFile,
        ));
    if (state.hasValue) ref.invalidate(kycStatusProvider);
    return state.value;
  }
}

final submitKycProvider =
    AsyncNotifierProvider<SubmitKycNotifier, KycModel?>(
        SubmitKycNotifier.new);
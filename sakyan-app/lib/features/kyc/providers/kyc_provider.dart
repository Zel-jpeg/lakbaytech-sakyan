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
    required File licenseFile,
    required File validIdFile,
    required File selfieFile,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(kycRepositoryProvider).submitKyc(
          licenseFile: licenseFile,
          validIdFile: validIdFile,
          selfieFile:  selfieFile,
        ));
    if (state.hasValue) ref.invalidate(kycStatusProvider);
    return state.value;
  }
}

final submitKycProvider =
    AsyncNotifierProvider<SubmitKycNotifier, KycModel?>(
        SubmitKycNotifier.new);
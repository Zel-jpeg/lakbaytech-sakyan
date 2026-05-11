/// KYC model — mirrors Django's CustomerProfile KYC response.
///
/// The backend returns the customer profile flat object with `kyc_status`,
/// NOT a separate KYC document with a `status` field. This model correctly
/// reads `kyc_status` so new users (who have no profile yet and get back
/// `{kyc_status: 'not_submitted'}`) are handled correctly.
class KycModel {
  final String id;
  final String userId;
  final String licenseUrl;
  final String validIdUrl;
  final String status; // 'not_submitted' | 'pending' | 'approved' | 'rejected'
  final String? rejectionReason;
  final DateTime? createdAt;

  const KycModel({
    this.id = '',
    this.userId = '',
    this.licenseUrl = '',
    this.validIdUrl = '',
    this.status = 'not_submitted',
    this.rejectionReason,
    this.createdAt,
  });

  bool get isNotSubmitted => status == 'not_submitted';
  bool get isPending      => status == 'pending';
  bool get isApproved     => status == 'approved';
  bool get isRejected     => status == 'rejected';

  factory KycModel.fromJson(Map<String, dynamic> json) => KycModel(
        id:              json['id']                   as String? ?? '',
        userId:          json['user']                 as String? ?? '',
        licenseUrl:      json['drivers_license_url']  as String? ?? '',
        validIdUrl:      json['valid_id_url']          as String? ?? '',
        // Backend returns `kyc_status`, not `status`
        status:          json['kyc_status']            as String? ?? 'not_submitted',
        rejectionReason: json['kyc_rejection_reason'] as String?,
        createdAt: json['kyc_submitted_at'] != null
            ? DateTime.tryParse(json['kyc_submitted_at'] as String)
            : null,
      );
}
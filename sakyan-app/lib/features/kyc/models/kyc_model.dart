/// KYC model — mirrors Django's KYC document response.
class KycModel {
  final String id;
  final String userId;
  final String licenseUrl;
  final String validIdUrl;
  final String selfieUrl;
  final String status; // 'pending' | 'approved' | 'rejected'
  final String? rejectionReason;
  final DateTime createdAt;

  const KycModel({
    required this.id,
    required this.userId,
    this.licenseUrl = '',
    this.validIdUrl = '',
    this.selfieUrl = '',
    this.status = 'pending',
    this.rejectionReason,
    required this.createdAt,
  });

  bool get isPending  => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';

  factory KycModel.fromJson(Map<String, dynamic> json) => KycModel(
        id:               json['id']               as String? ?? '',
        userId:           json['user']             as String? ?? '',
        licenseUrl:       json['license_url']      as String? ?? '',
        validIdUrl:       json['valid_id_url']      as String? ?? '',
        selfieUrl:        json['selfie_url']        as String? ?? '',
        status:           json['status']            as String? ?? 'pending',
        rejectionReason:  json['rejection_reason']  as String?,
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
            : DateTime.now(),
      );
}
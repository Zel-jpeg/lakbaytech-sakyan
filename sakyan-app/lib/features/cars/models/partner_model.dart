/// Lightweight approved-partner model used in the Browse Cars
/// filter sheet (pills + searchable list) and the featured banner.
class ApprovedPartnerModel {
  final String id;
  final String businessName;
  final String partnerType; // 'individual' | 'company'
  final int carCount;
  final String? logoUrl;

  const ApprovedPartnerModel({
    required this.id,
    required this.businessName,
    required this.partnerType,
    required this.carCount,
    this.logoUrl,
  });

  factory ApprovedPartnerModel.fromJson(Map<String, dynamic> json) {
    return ApprovedPartnerModel(
      id:           json['id']?.toString()            ?? '',
      businessName: json['business_name']?.toString() ??
                    json['contact_person']?.toString() ??
                    json['full_name']?.toString()      ?? 'Partner',
      partnerType:  json['partner_type']?.toString()  ?? 'individual',
      carCount:     (json['car_count'] as num?)?.toInt() ?? 0,
      logoUrl:      json['logo_url']?.toString().isNotEmpty == true
                    ? json['logo_url'].toString()
                    : (json['logo']?.toString().isNotEmpty == true
                       ? json['logo'].toString()
                       : null),
    );
  }

  /// Display label shown in pills & dropdown.
  String get displayName => businessName;

  /// Short badge text.
  String get typeLabel =>
      partnerType == 'company' ? 'Company' : 'Individual';
}


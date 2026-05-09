/// Partner profile model — mirrors Django's Partner serializer.
class PartnerModel {
  final String id;
  final String userId;
  final String businessName;
  final String partnerType; // 'individual' | 'company'
  final String businessAddress;
  final String businessPermitUrl;
  final String governmentIdUrl;
  final String contactPerson;
  final String contactPhone;
  final double commissionRate;
  final String status; // 'pending' | 'approved' | 'rejected' | 'suspended'
  final String? rejectionReason;

  const PartnerModel({
    required this.id,
    required this.userId,
    this.businessName      = '',
    this.partnerType       = 'individual',
    this.businessAddress   = '',
    this.businessPermitUrl = '',
    this.governmentIdUrl   = '',
    this.contactPerson     = '',
    this.contactPhone      = '',
    this.commissionRate    = 10.0,
    this.status            = 'pending',
    this.rejectionReason,
  });

  bool get isPending   => status == 'pending';
  bool get isApproved  => status == 'approved';
  bool get isRejected  => status == 'rejected';
  bool get isSuspended => status == 'suspended';

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }

  factory PartnerModel.fromJson(Map<String, dynamic> json) {
    // user can be nested or string
    String userId = '';
    final u = json['user'];
    if (u is Map) {
      userId = u['id'] as String? ?? '';
    } else if (u is String) {
      userId = u;
    }

    return PartnerModel(
      id:                json['id']                  as String? ?? '',
      userId:            userId,
      businessName:      json['business_name']        as String? ?? '',
      partnerType:       json['partner_type']         as String? ?? 'individual',
      businessAddress:   json['business_address']     as String? ?? '',
      businessPermitUrl: json['business_permit_url']  as String? ?? '',
      governmentIdUrl:   json['government_id_url']    as String? ?? '',
      contactPerson:     json['contact_person']       as String? ?? '',
      contactPhone:      json['contact_phone']        as String? ?? '',
      commissionRate:    _toDouble(json['commission_rate']),
      status:            json['status']               as String? ?? 'pending',
      rejectionReason:   json['rejection_reason']     as String?,
    );
  }
}

/// Lightweight stats object returned by partner dashboard queries.
class PartnerStatsModel {
  final double totalEarnings;
  final int activeBookings;
  final int totalCars;
  final int pendingRequests;
  final int completedBookings;

  const PartnerStatsModel({
    this.totalEarnings    = 0,
    this.activeBookings   = 0,
    this.totalCars        = 0,
    this.pendingRequests  = 0,
    this.completedBookings = 0,
  });

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }

  factory PartnerStatsModel.fromJson(Map<String, dynamic> json) =>
      PartnerStatsModel(
        totalEarnings:     _toDouble(json['total_earnings']),
        activeBookings:    json['active_bookings']    as int? ?? 0,
        totalCars:         json['total_cars']         as int? ?? 0,
        pendingRequests:   json['pending_requests']   as int? ?? 0,
        completedBookings: json['completed_bookings'] as int? ?? 0,
      );
}
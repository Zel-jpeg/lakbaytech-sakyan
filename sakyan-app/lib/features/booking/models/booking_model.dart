class BookingModel {
  final String id;
  final String bookingCode;
  final String carId;
  final String carName;
  final String? carImageUrl;
  final String customerId;
  final String customerName;
  final String partnerId;
  final String partnerName;
  final String startDate;
  final String endDate;
  final String pickupLocation;
  final String returnLocation;
  final int totalDays;
  final double pricePerDay;
  final double subtotal;
  final double commissionAmount;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final String gcashReference;
  final String bookingStatus;
  final String specialRequests;
  final String fulfillmentType;
  final String deliveryAddress;
  final String? actualStartTime;
  final String? actualReturnTime;
  final DateTime createdAt;

  const BookingModel({
    required this.id,
    required this.bookingCode,
    this.carId           = '',
    this.carName         = '',
    this.carImageUrl,
    this.customerId      = '',
    this.customerName    = '',
    this.partnerId       = '',
    this.partnerName     = '',
    required this.startDate,
    required this.endDate,
    this.pickupLocation  = '',
    this.returnLocation  = '',
    this.totalDays       = 0,
    this.pricePerDay     = 0,
    this.subtotal        = 0,
    this.commissionAmount= 0,
    this.totalAmount     = 0,
    this.paymentMethod   = 'cash',
    this.paymentStatus   = 'pending',
    this.gcashReference  = '',
    this.bookingStatus   = 'pending_review',
    this.specialRequests = '',
    this.fulfillmentType = 'pickup',
    this.deliveryAddress = '',
    this.actualStartTime,
    this.actualReturnTime,
    required this.createdAt,
  });

  // ── Safe parsers — Django DecimalField serialises as String e.g. "1500.00" ──
  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  // ── Status helpers ────────────────────────────────────────────────────────
  bool get isPendingReview => bookingStatus == 'pending_review';
  bool get isApproved      => bookingStatus == 'approved';
  bool get isActive        => bookingStatus == 'active';
  bool get isCompleted     => bookingStatus == 'completed';
  bool get isCancelled     => bookingStatus == 'cancelled';
  bool get isRejected      => bookingStatus == 'rejected';
  bool get canCancel       => isPendingReview || isApproved;

  String get statusLabel {
    switch (bookingStatus) {
      case 'pending_review': return 'Pending Review';
      case 'approved':       return 'Approved';
      case 'rejected':       return 'Rejected';
      case 'active':         return 'Active';
      case 'completed':      return 'Completed';
      case 'cancelled':      return 'Cancelled';
      default:               return bookingStatus;
    }
  }

  // ── Serialization ─────────────────────────────────────────────────────────
  factory BookingModel.fromJson(Map<String, dynamic> json) {
    // car can be a nested object or uuid string
    String carId = '', carName = '', carImageUrl_ = '';
    final c = json['car'];
    if (c is Map) {
      carId   = c['id']   as String? ?? '';
      carName = c['name'] as String? ?? '';
      // images array on nested car
      final imgs = c['images'];
      if (imgs is List && imgs.isNotEmpty) {
        carImageUrl_ = (imgs.first as Map)['image_url'] as String? ?? '';
      }
      // flat primary_image on nested car (list endpoint)
      if (carImageUrl_.isEmpty) {
        carImageUrl_ = c['primary_image'] as String? ?? '';
      }
    } else if (c is String) {
      carId = c;
    }

    // customer can be nested or string
    String customerId = '', customerName = '';
    final cu = json['customer'];
    if (cu is Map) {
      customerId   = cu['id']        as String? ?? '';
      customerName = cu['full_name'] as String? ?? '';
    } else if (cu is String) {
      customerId = cu;
    }

    // partner can be nested or string
    String partnerId = '', partnerName = '';
    final p = json['partner'];
    if (p is Map) {
      partnerId   = p['id']        as String? ?? '';
      partnerName = p['full_name'] as String? ?? (p['business_name'] as String? ?? '');
    } else if (p is String) {
      partnerId = p;
    }

    return BookingModel(
      id:               json['id']                as String? ?? '',
      bookingCode:      json['booking_code']       as String? ?? '',
      carId:            carId,
      carName:          carName,
      carImageUrl:      carImageUrl_.isEmpty ? null : carImageUrl_,
      customerId:       customerId,
      customerName:     customerName,
      partnerId:        partnerId,
      partnerName:      partnerName,
      startDate:        json['start_date']         as String? ?? '',
      endDate:          json['end_date']           as String? ?? '',
      pickupLocation:   json['pickup_location']    as String? ?? '',
      returnLocation:   json['return_location']    as String? ?? '',
      totalDays:        _toInt(json['total_days']),
      // ── FIX: use _toDouble() — Django returns these as strings e.g. "1500.00"
      pricePerDay:      _toDouble(json['price_per_day']),
      subtotal:         _toDouble(json['subtotal']),
      commissionAmount: _toDouble(json['commission_amount']),
      totalAmount:      _toDouble(json['total_amount']),
      // ─────────────────────────────────────────────────────────────────────
      paymentMethod:    json['payment_method']     as String? ?? 'cash',
      paymentStatus:    json['payment_status']     as String? ?? 'pending',
      gcashReference:   json['gcash_reference']    as String? ?? '',
      bookingStatus:    json['booking_status']     as String? ?? 'pending_review',
      specialRequests:  json['special_requests']   as String? ?? '',
      fulfillmentType:  json['fulfillment_type']   as String? ?? 'pickup',
      deliveryAddress:  json['delivery_address']   as String? ?? '',
      actualStartTime:  json['actual_start_time']  as String?,
      actualReturnTime: json['actual_return_time'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
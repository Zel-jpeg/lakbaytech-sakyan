class BookingModel {
  final String id;
  final String bookingCode;
  final String carId;
  final String carName;
  final String? carImageUrl;
  final String customerId;
  final String customerName;
  final String partnerId;
  final String startDate;   // YYYY-MM-DD
  final String endDate;     // YYYY-MM-DD
  final String pickupLocation;
  final String returnLocation;
  final int totalDays;
  final double pricePerDay;
  final double subtotal;
  final double commissionAmount;
  final double totalAmount;
  final String paymentMethod;   // 'gcash' | 'cash'
  final String paymentStatus;   // 'pending' | 'partial' | 'paid' | 'refunded'
  final String gcashReference;
  final String bookingStatus;   // 'pending_review' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
  final String specialRequests;
  final String fulfillmentType; // 'pickup' | 'delivery'
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
    // car can be a nested object or uuid
    String carId = '', carName = '', carImageUrl_ = '';
    final c = json['car'];
    if (c is Map) {
      carId   = c['id']   as String? ?? '';
      carName = c['name'] as String? ?? '';
      final imgs = c['images'];
      if (imgs is List && imgs.isNotEmpty) {
        carImageUrl_ = (imgs.first as Map)['image_url'] as String? ?? '';
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
    String partnerId = '';
    final p = json['partner'];
    if (p is Map) {
      partnerId = p['id'] as String? ?? '';
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
      startDate:        json['start_date']         as String? ?? '',
      endDate:          json['end_date']           as String? ?? '',
      pickupLocation:   json['pickup_location']    as String? ?? '',
      returnLocation:   json['return_location']    as String? ?? '',
      totalDays:        json['total_days']         as int? ?? 0,
      pricePerDay:      (json['price_per_day']     as num?)?.toDouble() ?? 0,
      subtotal:         (json['subtotal']          as num?)?.toDouble() ?? 0,
      commissionAmount: (json['commission_amount'] as num?)?.toDouble() ?? 0,
      totalAmount:      (json['total_amount']      as num?)?.toDouble() ?? 0,
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
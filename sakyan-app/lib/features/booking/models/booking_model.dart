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
  // ── USER uuid of the partner — needed for /messages/ API ─────────────────
  // partnerId holds the partner-profile uuid; the messages receiver field must
  // be the user uuid, which lives at partner.user.id in the Django response.
  final String partnerUserId;
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
    this.partnerUserId   = '',
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

  // ── Safe parsers ──────────────────────────────────────────────────────────

  /// Never throws — converts any value to String safely.
  static String _s(dynamic v) => v?.toString() ?? '';

  /// Django DecimalField serialises as String e.g. "1500.00"
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

    // ── car ──────────────────────────────────────────────────────────────────
    String carId = '', carName = '', carImageUrl_ = '';
    final c = json['car'];
    if (c is Map) {
      carId   = _s(c['id']);
      carName = _s(c['name']);
      // Try images array first
      final imgs = c['images'];
      if (imgs is List && imgs.isNotEmpty) {
        final first = imgs.first;
        if (first is Map) {
          carImageUrl_ = _s(first['image_url']);
        }
      }
      // Fallback flat fields
      if (carImageUrl_.isEmpty) carImageUrl_ = _s(c['primary_image']);
      if (carImageUrl_.isEmpty) carImageUrl_ = _s(c['primary_image_url']);
      if (carImageUrl_.isEmpty) carImageUrl_ = _s(c['cover_image']);
      if (carImageUrl_.isEmpty) carImageUrl_ = _s(c['image_url']);
    } else if (c is String) {
      carId = c;
    }
    // Flat fallback at booking level
    if (carName.isEmpty) carName = _s(json['car_name']);

    // ── customer ──────────────────────────────────────────────────────────────
    // Django may return customer as a nested User Map or a plain UUID string.
    String customerId = '', customerName = '';
    final cu = json['customer'];
    if (cu is Map) {
      customerId   = _s(cu['id']);
      customerName = _s(cu['full_name']);
      // Some serializers use 'name' instead of 'full_name'
      if (customerName.isEmpty) customerName = _s(cu['name']);
      // Some serializers build first+last
      if (customerName.isEmpty) {
        final first = _s(cu['first_name']);
        final last  = _s(cu['last_name']);
        customerName = '$first $last'.trim();
      }
      // Some serializers nest user inside customer
      if (customerName.isEmpty) {
        final u = cu['user'];
        if (u is Map) {
          customerName = _s(u['full_name']);
          if (customerName.isEmpty) customerName = _s(u['name']);
        }
      }
    } else if (cu is String) {
      customerId = cu;
    }
    // Flat fallback
    if (customerName.isEmpty) customerName = _s(json['customer_name']);

    // ── partner ───────────────────────────────────────────────────────────────
    // Django Partner model:
    //   { id: <partner-profile-uuid>, user: { id: <user-uuid>, full_name: ... },
    //     business_name: ..., ... }
    //
    // partnerId    = partner-profile UUID (used for /partner/... API routes)
    // partnerUserId = user UUID            (used for /messages/ receiver field)
    String partnerId = '', partnerName = '', partnerUserId = '';
    final p = json['partner'];
    if (p is Map) {
      partnerId = _s(p['id']);

      // Extract the user UUID from the nested user object
      final pu = p['user'];
      if (pu is Map) {
        partnerUserId = _s(pu['id']);
        partnerName   = _s(pu['full_name']);
        if (partnerName.isEmpty) partnerName = _s(pu['name']);
      } else if (pu is String && pu.isNotEmpty) {
        partnerUserId = pu;
      }

      // Fallback name from business_name or full_name on partner object
      if (partnerName.isEmpty) partnerName = _s(p['full_name']);
      if (partnerName.isEmpty) partnerName = _s(p['business_name']);

      // Last resort: if we have no user UUID, fall back to partner profile UUID.
      // This may fail the messages API but at least we pass SOMETHING.
      if (partnerUserId.isEmpty) partnerUserId = partnerId;

    } else if (p is String) {
      partnerId     = p;
      partnerUserId = p;
    }

    // ── dates — guard DateTime.tryParse against non-String values ─────────
    String? actualStartTime;
    final rawStart = json['actual_start_time'];
    if (rawStart is String && rawStart.isNotEmpty) actualStartTime = rawStart;

    String? actualReturnTime;
    final rawReturn = json['actual_return_time'];
    if (rawReturn is String && rawReturn.isNotEmpty) actualReturnTime = rawReturn;

    DateTime createdAt = DateTime.now();
    final rawCa = json['created_at'];
    if (rawCa is String && rawCa.isNotEmpty) {
      createdAt = DateTime.tryParse(rawCa) ?? DateTime.now();
    }

    return BookingModel(
      id:               _s(json['id']),
      bookingCode:      _s(json['booking_code']),
      carId:            carId,
      carName:          carName,
      carImageUrl:      carImageUrl_.isEmpty ? null : carImageUrl_,
      customerId:       customerId,
      customerName:     customerName,
      partnerId:        partnerId,
      partnerName:      partnerName,
      partnerUserId:    partnerUserId,
      startDate:        _s(json['start_date']),
      endDate:          _s(json['end_date']),
      pickupLocation:   _s(json['pickup_location']),
      returnLocation:   _s(json['return_location']),
      totalDays:        _toInt(json['total_days']),
      pricePerDay:      _toDouble(json['price_per_day']),
      subtotal:         _toDouble(json['subtotal']),
      commissionAmount: _toDouble(json['commission_amount']),
      totalAmount:      _toDouble(json['total_amount']),
      paymentMethod:    _s(json['payment_method']).isNotEmpty ? _s(json['payment_method']) : 'cash',
      paymentStatus:    _s(json['payment_status']).isNotEmpty ? _s(json['payment_status']) : 'pending',
      gcashReference:   _s(json['gcash_reference']),
      bookingStatus:    _s(json['booking_status']).isNotEmpty ? _s(json['booking_status']) : 'pending_review',
      specialRequests:  _s(json['special_requests']),
      fulfillmentType:  _s(json['fulfillment_type']).isNotEmpty ? _s(json['fulfillment_type']) : 'pickup',
      deliveryAddress:  _s(json['delivery_address']),
      actualStartTime:  actualStartTime,
      actualReturnTime: actualReturnTime,
      createdAt:        createdAt,
    );
  }
}
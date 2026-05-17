// ── Safe string extractor — never throws, returns '' for nulls/non-strings ──
String _s(dynamic v) => v?.toString() ?? '';

class MessageModel {
  final String id;
  final String? bookingId;
  final String senderId;
  final String senderName;
  final String senderAvatar;
  final String receiverId;
  final String receiverName;
  final String content;
  final String? imageUrl;
  final bool isRead;
  final DateTime createdAt;

  const MessageModel({
    required this.id,
    this.bookingId,
    required this.senderId,
    this.senderName   = '',
    this.senderAvatar = '',
    required this.receiverId,
    this.receiverName = '',
    required this.content,
    this.imageUrl,
    this.isRead     = false,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    // ── sender ────────────────────────────────────────────────────────────
    String senderId = '', senderName = '', senderAvatar = '';
    final s = json['sender'];
    if (s is Map) {
      senderId     = _s(s['id']);
      senderName   = _s(s['full_name']);
      senderAvatar = _s(s['avatar_url']);
    } else if (s is String) {
      senderId = s;
    }

    // ── receiver ──────────────────────────────────────────────────────────
    String receiverId = '', receiverName = '';
    final r = json['receiver'];
    if (r is Map) {
      receiverId   = _s(r['id']);
      receiverName = _s(r['full_name']);
    } else if (r is String) {
      receiverId = r;
    }

    // ── booking field — Django returns UUID string or expanded Map ─────────
    String? bookingId;
    final bk = json['booking'];
    if (bk is String && bk.isNotEmpty) {
      bookingId = bk;
    } else if (bk is Map) {
      final bid = _s(bk['id']);
      if (bid.isNotEmpty) bookingId = bid;
    }
    // honour flat booking_id field too
    if (bookingId == null || bookingId.isEmpty) {
      final bid = json['booking_id'];
      if (bid is String && bid.isNotEmpty) bookingId = bid;
    }

    // ── image_url ─────────────────────────────────────────────────────────
    String? imageUrl;
    final rawImg = json['image_url'];
    if (rawImg is String && rawImg.isNotEmpty) {
      imageUrl = rawImg;
    }

    // ── created_at — guard against non-string values ──────────────────────
    DateTime createdAt = DateTime.now();
    final rawCa = json['created_at'];
    if (rawCa is String && rawCa.isNotEmpty) {
      createdAt = DateTime.tryParse(rawCa) ?? DateTime.now();
    }

    return MessageModel(
      id:           _s(json['id']),
      bookingId:    bookingId,
      senderId:     senderId,
      senderName:   senderName,
      senderAvatar: senderAvatar,
      receiverId:   receiverId,
      receiverName: receiverName,
      content:      _s(json['content']),
      imageUrl:     imageUrl,
      isRead:       json['is_read'] as bool? ?? false,
      createdAt:    createdAt,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/// A "conversation" summary returned by GET /messages/conversations/
class ConversationModel {
  final String bookingId;
  final String bookingCode;
  final String otherUserId;
  final String otherUserName;
  final String otherUserAvatar;
  final String lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;
  final String carName;

  /// True when this thread is a Sakyan Support conversation (no booking).
  bool get isSupport => bookingId.isEmpty;

  const ConversationModel({
    required this.bookingId,
    required this.bookingCode,
    required this.otherUserId,
    this.otherUserName   = '',
    this.otherUserAvatar = '',
    this.lastMessage     = '',
    required this.lastMessageAt,
    this.unreadCount = 0,
    this.carName     = '',
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    // ── The backend ConversationListView returns FLAT fields, not a nested
    // `other_user` object. The structure is:
    //   {
    //     "booking_id":      "uuid",
    //     "booking_code":    "SKY-...",
    //     "car_name":        "Toyota Vios",
    //     "customer_name":   "Juan Dela Cruz",
    //     "partner_name":    "ABC Rentals",      ← business name
    //     "customer_id":     "uuid",
    //     "partner_user_id": "uuid",
    //     "unread_count":    2,
    //     "is_support":      false,              ← optional flag
    //     "last_message":    { "content": "...", "created_at": "...", "sender_id": "..." }
    //   }
    // We store the partner side as "other user" since the app is customer-facing.
    // ─────────────────────────────────────────────────────────────────────────

    // ── booking_id ────────────────────────────────────────────────────────────
    String bookingId = '';
    final rawBid = json['booking_id'];
    final rawB   = json['booking'];
    if (rawBid is String && rawBid.isNotEmpty) {
      bookingId = rawBid;
    } else if (rawB is String && rawB.isNotEmpty) {
      bookingId = rawB;
    } else if (rawB is Map) {
      bookingId = _s(rawB['id']);
    }

    // ── booking_code ──────────────────────────────────────────────────────────
    String bookingCode = _s(json['booking_code']);
    if (bookingCode.isEmpty && rawB is Map) {
      bookingCode = _s(rawB['booking_code']);
    }

    // ── is_support flag ───────────────────────────────────────────────────────
    // Backend sets is_support: true OR booking_id: 'support' / 'support:<uuid>'
    final isSupport = (json['is_support'] == true) ||
        bookingId.startsWith('support');

    // ── other user (partner side for customers) ───────────────────────────────
    // Backend returns partner_name (business name) and partner_user_id
    String otherUserId   = _s(json['partner_user_id']);
    String otherUserName = _s(json['partner_name']);   // business_name
    String otherUserAvatar = '';

    // Fallback: try nested other_user object (future-proofing)
    final o = json['other_user'];
    if (o is Map) {
      if (otherUserId.isEmpty)   otherUserId   = _s(o['id']);
      if (otherUserName.isEmpty) otherUserName = _s(o['full_name']);
      if (otherUserAvatar.isEmpty) otherUserAvatar = _s(o['avatar_url']);
    }

    // ── car name ──────────────────────────────────────────────────────────────
    String carName = _s(json['car_name']);
    final car = json['car'];
    if (carName.isEmpty && car is Map) carName = _s(car['name']);

    // ── last_message ──────────────────────────────────────────────────────────
    final rawLm = json['last_message'];
    String lastMessage = '';
    if (rawLm is String) {
      lastMessage = rawLm;
    } else if (rawLm is Map) {
      lastMessage = _s(rawLm['content']);
    }

    // ── last_message_at ───────────────────────────────────────────────────────
    DateTime lastMessageAt = DateTime.now();
    final rawAt = json['last_message_at'];
    if (rawAt is String && rawAt.isNotEmpty) {
      lastMessageAt = DateTime.tryParse(rawAt) ?? DateTime.now();
    } else if (rawLm is Map) {
      final rawCreated = rawLm['created_at'];
      if (rawCreated is String && rawCreated.isNotEmpty) {
        lastMessageAt = DateTime.tryParse(rawCreated) ?? DateTime.now();
      }
    }

    // ── unread_count ──────────────────────────────────────────────────────────
    int unreadCount = 0;
    final rawUc = json['unread_count'];
    if (rawUc is int) {
      unreadCount = rawUc;
    } else if (rawUc is String) {
      unreadCount = int.tryParse(rawUc) ?? 0;
    }

    return ConversationModel(
      bookingId:       bookingId,
      bookingCode:     bookingCode,
      otherUserId:     otherUserId,
      otherUserName:   otherUserName,
      otherUserAvatar: otherUserAvatar,
      lastMessage:     lastMessage,
      lastMessageAt:   lastMessageAt,
      unreadCount:     unreadCount,
      carName:         carName,
    );
  }
}
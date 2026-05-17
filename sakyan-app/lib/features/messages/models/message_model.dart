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
  /// The backend returns booking_id = 'support'; locally-built entries use ''.
  bool get isSupport => bookingId.isEmpty || bookingId == 'support' || bookingId.startsWith('support:');

  /// True when this is a pre-booking inquiry thread.
  bool get isInquiry => bookingId.startsWith('inquiry:') || type == 'inquiry';

  /// Partner PK for inquiry threads (used to call GET /messages/inquiry/?partner_id=)
  final String? partnerId;

  /// Conversation type string from backend ('inquiry', 'support', 'booking').
  final String type;

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
    this.partnerId,
    this.type        = '',
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    // ── other_user — nested object (preferred) or fall back to flat fields ──
    // Backend now returns:  other_user: { id, full_name, avatar_url }
    // Old / support entries may still have only flat fields.
    String otherUserId = '', otherUserName = '', otherUserAvatar = '';
    final o = json['other_user'];
    if (o is Map) {
      otherUserId     = _s(o['id']);
      otherUserName   = _s(o['full_name']);
      otherUserAvatar = _s(o['avatar_url']);
    } else if (o is String) {
      otherUserId = o;
    }

    // ── Flat-field fallback (customers see partner, partners see customer) ──
    // When other_user is absent try partner fields first (customer view),
    // then customer fields (partner view).
    if (otherUserId.isEmpty)   otherUserId   = _s(json['partner_user_id']);
    if (otherUserName.isEmpty) otherUserName = _s(json['partner_name']);
    if (otherUserId.isEmpty)   otherUserId   = _s(json['customer_id']);
    if (otherUserName.isEmpty) otherUserName = _s(json['customer_name']);

    // ── car name — nested Map or flat field ───────────────────────────────
    String carName = '';
    final car = json['car'];
    if (car is Map) carName = _s(car['name']);
    if (carName.isEmpty) carName = _s(json['car_name']);

    // ── booking / booking_id ──────────────────────────────────────────────
    // Never use `as String?` here — booking may be an expanded Map.
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

    // ── booking_code — may be at top level or inside booking object ────────
    String bookingCode = '';
    final rawBc = json['booking_code'];
    if (rawBc is String && rawBc.isNotEmpty) {
      bookingCode = rawBc;
    } else if (rawB is Map) {
      bookingCode = _s(rawB['booking_code']);
    }

    // ── last_message — might be null or non-string ─────────────────────────
    final rawLm = json['last_message'];
    String lastMessage = '';
    if (rawLm is String) {
      lastMessage = rawLm;
    } else if (rawLm is Map) {
      // backend returns { content, created_at, sender_id }
      lastMessage = _s(rawLm['content']);
    }

    // ── last_message_at ────────────────────────────────────────────────────
    DateTime lastMessageAt = DateTime.now();
    final rawAt = json['last_message_at'];
    if (rawAt is String && rawAt.isNotEmpty) {
      lastMessageAt = DateTime.tryParse(rawAt) ?? DateTime.now();
    } else if (rawLm is Map) {
      // fallback: parse from nested last_message object
      final rawCreated = rawLm['created_at'];
      if (rawCreated is String && rawCreated.isNotEmpty) {
        lastMessageAt = DateTime.tryParse(rawCreated) ?? DateTime.now();
      }
    }

    // ── unread_count — might come as String from some serialisers ─────────
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
      partnerId:       json['partner_id']?.toString(),
      type:            json['type']?.toString() ?? '',
    );
  }
}
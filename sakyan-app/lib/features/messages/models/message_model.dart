class MessageModel {
  final String id;
  final String? bookingId;
  final String senderId;
  final String senderName;
  final String senderAvatar;
  final String receiverId;
  final String receiverName;
  final String content;
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
    this.isRead     = false,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    // sender can be nested object or id string
    String senderId = '', senderName = '', senderAvatar = '';
    final s = json['sender'];
    if (s is Map) {
      senderId     = s['id']         as String? ?? '';
      senderName   = s['full_name']  as String? ?? '';
      senderAvatar = s['avatar_url'] as String? ?? '';
    } else if (s is String) {
      senderId = s;
    }

    // receiver
    String receiverId = '', receiverName = '';
    final r = json['receiver'];
    if (r is Map) {
      receiverId   = r['id']        as String? ?? '';
      receiverName = r['full_name'] as String? ?? '';
    } else if (r is String) {
      receiverId = r;
    }

    return MessageModel(
      id:           json['id']       as String? ?? '',
      bookingId:    json['booking']  as String?,
      senderId:     senderId,
      senderName:   senderName,
      senderAvatar: senderAvatar,
      receiverId:   receiverId,
      receiverName: receiverName,
      content:      json['content']  as String? ?? '',
      isRead:       json['is_read']  as bool?   ?? false,
      createdAt:    json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

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
    // other_user can be a nested object
    String otherUserId = '', otherUserName = '', otherUserAvatar = '';
    final o = json['other_user'];
    if (o is Map) {
      otherUserId     = o['id']         as String? ?? '';
      otherUserName   = o['full_name']  as String? ?? '';
      otherUserAvatar = o['avatar_url'] as String? ?? '';
    } else if (o is String) {
      otherUserId = o;
    }

    // car name from nested booking.car
    String carName = '';
    final car = json['car'];
    if (car is Map) carName = car['name'] as String? ?? '';
    if (carName.isEmpty) carName = json['car_name'] as String? ?? '';

    return ConversationModel(
      bookingId:        json['booking_id']    as String? ?? json['booking'] as String? ?? '',
      bookingCode:      json['booking_code']  as String? ?? '',
      otherUserId:      otherUserId,
      otherUserName:    otherUserName,
      otherUserAvatar:  otherUserAvatar,
      lastMessage:      json['last_message']  as String? ?? '',
      lastMessageAt:    json['last_message_at'] != null
          ? DateTime.tryParse(json['last_message_at'] as String) ?? DateTime.now()
          : DateTime.now(),
      unreadCount: json['unread_count'] as int? ?? 0,
      carName:     carName,
    );
  }
}
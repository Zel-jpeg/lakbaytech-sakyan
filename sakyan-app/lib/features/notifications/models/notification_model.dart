class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String? referenceId;
  final DateTime createdAt;

  const NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    this.type        = 'general',
    this.isRead      = false,
    this.referenceId,
    required this.createdAt,
  });

  NotificationModel copyWith({bool? isRead}) => NotificationModel(
        id:          id,
        userId:      userId,
        title:       title,
        message:     message,
        type:        type,
        isRead:      isRead ?? this.isRead,
        referenceId: referenceId,
        createdAt:   createdAt,
      );

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      NotificationModel(
        id:          json['id']           as String? ?? '',
        userId:      json['user']         as String? ?? '',
        title:       json['title']        as String? ?? '',
        message:     json['message']      as String? ?? '',
        type:        json['type']         as String? ?? 'general',
        isRead:      json['is_read']      as bool?   ?? false,
        referenceId: json['reference_id'] as String?,
        createdAt:   json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
            : DateTime.now(),
      );
}
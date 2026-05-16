import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../models/message_model.dart';

class MessageRepository {
  const MessageRepository();

  // ── Conversations list ─────────────────────────────────────────────────────
  Future<List<ConversationModel>> getConversations() async {
    // Run both requests in parallel
    final futures = await Future.wait<dynamic>([
      ApiService.get('/messages/conversations/'),
      ApiService.get('/messages/support/').catchError((_) => null),
    ]);

    final res = futures[0];
    final raw = res?.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List
            ? raw['results'] as List
            : []);
    final conversations = list
        .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
        .toList();

    // ── Prepend synthetic Sakyan Support conversation ──────────────────────
    // Parse last support message for preview
    String lastSupportMsg = 'Tap to contact Sakyan Support';
    DateTime lastSupportAt = DateTime.now();
    int supportUnread = 0;
    try {
      final supportRes = futures[1];
      if (supportRes != null) {
        final sRaw = supportRes.data;
        List sList = sRaw is List
            ? sRaw
            : (sRaw is Map && sRaw['results'] is List
                ? sRaw['results'] as List
                : []);
        if (sList.isNotEmpty) {
          final last = sList.last as Map<String, dynamic>;
          lastSupportMsg = last['content']?.toString() ?? lastSupportMsg;
          final ts = last['created_at']?.toString();
          if (ts != null && ts.isNotEmpty) {
            lastSupportAt = DateTime.tryParse(ts) ?? lastSupportAt;
          }
        }
      }
    } catch (_) {}

    final supportConv = ConversationModel(
      bookingId:     '',  // empty = isSupport
      bookingCode:   '',
      otherUserId:   '',
      otherUserName: 'Sakyan Support',
      lastMessage:   lastSupportMsg,
      lastMessageAt: lastSupportAt,
      unreadCount:   supportUnread,
      carName:       '',
    );

    return [supportConv, ...conversations];
  }

  // ── Messages for a booking ─────────────────────────────────────────────────
  Future<List<MessageModel>> getMessages(String bookingId) async {
    final res = await ApiService.get('/messages/$bookingId/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List
            ? raw['results'] as List
            : []);
    return list
        .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Send a message ─────────────────────────────────────────────────────────
  //
  // FIX (image FK error):
  //   Django REST Framework PrimaryKeyRelatedField serialises FK write fields
  //   as `<field>_id` by default. Sending plain `'booking'` or `'receiver'`
  //   UUIDs caused "does not exist" FK validation errors.
  //
  //   Additionally, when an image_url is included the backend must receive
  //   it as a plain string — NOT a multipart upload. Supabase already gave
  //   us the public URL; we just send that URL in the JSON payload.
  //
  //   Strategy:
  //     1. Primary attempt: booking_id / receiver_id  (DRF PrimaryKeyRelatedField)
  //     2. Fallback:        booking / receiver        (some serializers use source=)
  //     3. Surface the cleanest Django validation error if both fail.
  // ──────────────────────────────────────────────────────────────────────────
  Future<MessageModel> sendMessage({
    required String bookingId,
    required String receiverId,
    required String content,
    String? imageUrl,
  }) async {
    // Guard: never send an empty receiver — the backend will 400 immediately.
    if (receiverId.isEmpty) {
      throw Exception('Cannot send message: recipient ID is missing.');
    }
    if (content.trim().isEmpty && (imageUrl == null || imageUrl.isEmpty)) {
      throw Exception('Cannot send an empty message.');
    }

    // ── Build payloads ────────────────────────────────────────────────────
    // Try both FK naming conventions since Django setups vary.
    // image_url is sent as a plain string (already uploaded to Supabase).
    Map<String, dynamic> _payload({required bool suffix}) => {
      if (suffix) 'booking_id': bookingId else 'booking': bookingId,
      if (suffix) 'receiver_id': receiverId else 'receiver': receiverId,
      'content': content.trim().isEmpty ? ' ' : content.trim(),
      // ── Image fix: send as plain JSON string, NOT multipart ──
      // The backend stores the Supabase public URL directly.
      if (imageUrl != null && imageUrl.isNotEmpty) 'image_url': imageUrl,
    };

    // ── Attempt 1: _id suffix (standard DRF) ────────────────────────────
    try {
      final res = await ApiService.post('/messages/', data: _payload(suffix: true));
      return MessageModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e1) {
      if (e1.response?.statusCode != 400) {
        // Not a validation error — surface immediately
        final msg = _extractDjangoError(e1.response?.data);
        if (msg != null) throw Exception(msg);
        rethrow;
      }

      // ── Attempt 2: no suffix fallback ───────────────────────────────
      try {
        final res = await ApiService.post('/messages/', data: _payload(suffix: false));
        return MessageModel.fromJson(res.data as Map<String, dynamic>);
      } on DioException catch (e2) {
        // Both failed — surface the best error message
        final msg = _extractDjangoError(e2.response?.data)
            ?? _extractDjangoError(e1.response?.data)
            ?? 'Failed to send message. Please try again.';
        throw Exception(msg);
      }
    }
  }

  // ── Support thread (no booking) ────────────────────────────────────────────
  Future<List<MessageModel>> getSupportMessages() async {
    final res = await ApiService.get('/messages/support/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List
            ? raw['results'] as List
            : []);
    return list
        .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<MessageModel> sendSupportMessage(String content,
      {String? imageUrl}) async {
    if (content.trim().isEmpty && (imageUrl == null || imageUrl.isEmpty)) {
      throw Exception('Cannot send an empty message.');
    }
    try {
      final res = await ApiService.post(
        '/messages/support/',
        data: {
          'content': content.trim(),
          if (imageUrl != null && imageUrl.isNotEmpty) 'image_url': imageUrl,
        },
      );
      return MessageModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final msg = _extractDjangoError(e.response?.data);
      if (msg != null) throw Exception(msg);
      rethrow;
    }
  }

  // ── Helper: turn a Django error body into a human-readable string ──────────
  static String? _extractDjangoError(dynamic body) {
    if (body == null) return null;
    if (body is String && body.isNotEmpty) return body;
    if (body is Map) {
      // Skip 'non_field_errors' wrapping if possible
      final parts = <String>[];
      for (final entry in body.entries) {
        final v = entry.value;
        if (v is List) {
          parts.add('${entry.key}: ${v.map((e) => e.toString()).join(', ')}');
        } else if (v is String) {
          parts.add('${entry.key}: $v');
        }
      }
      if (parts.isNotEmpty) return parts.join('\n');
    }
    return null;
  }
}
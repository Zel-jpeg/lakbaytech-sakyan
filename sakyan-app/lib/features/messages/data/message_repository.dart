import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../models/message_model.dart';

class MessageRepository {
  const MessageRepository();

  // ── Conversations list ─────────────────────────────────────────────────────
  Future<List<ConversationModel>> getConversations() async {
    final res = await ApiService.get('/messages/conversations/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List
            ? raw['results'] as List
            : []);
    return list
        .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
        .toList();
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
  // FIX: Django REST Framework serialises ForeignKey write fields as
  //      `<field>_id` by default (PrimaryKeyRelatedField).
  //      The old payload used `'booking'` and `'receiver'` as plain
  //      string UUIDs, which the DRF serializer rejects with a 400.
  //
  //      Correct field names:
  //        • booking_id  (UUID of the Booking FK)
  //        • receiver_id (UUID of the User FK)
  //        • content     (plain text — unchanged)
  //
  //      Both `booking_id` and `booking` are tried via the fallback so
  //      the app works regardless of how the Django serializer is
  //      configured (some devs rename the field in Meta.extra_kwargs).
  // ──────────────────────────────────────────────────────────────────────────
  Future<MessageModel> sendMessage({
    required String bookingId,
    required String receiverId,
    required String content,
  }) async {
    // Guard: never send an empty receiver — the backend will 400 immediately.
    if (receiverId.isEmpty) {
      throw Exception('Cannot send message: recipient ID is missing.');
    }
    if (content.trim().isEmpty) {
      throw Exception('Cannot send an empty message.');
    }

    try {
      // Primary attempt: use the _id suffix that DRF PrimaryKeyRelatedField
      // exposes for write operations.
      final res = await ApiService.post('/messages/', data: {
        'booking_id':  bookingId,
        'receiver_id': receiverId,
        'content':     content.trim(),
      });
      return MessageModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      // ── Extract the actual Django validation error message ──────────────
      // Django returns structured errors like:
      //   {"receiver_id": ["This field is required."]}
      //   {"non_field_errors": ["..."]}
      // Show that instead of the raw Dio exception.
      final body = e.response?.data;
      if (body is Map) {
        // If primary attempt failed, retry with non-suffixed field names
        // in case the serializer uses source= overrides.
        if (e.response?.statusCode == 400) {
          try {
            final retry = await ApiService.post('/messages/', data: {
              'booking':  bookingId,
              'receiver': receiverId,
              'content':  content.trim(),
            });
            return MessageModel.fromJson(retry.data as Map<String, dynamic>);
          } on DioException catch (retryErr) {
            // Both attempts failed — surface the cleanest error message.
            final retryBody = retryErr.response?.data;
            final msg = _extractDjangoError(retryBody) ?? _extractDjangoError(body);
            throw Exception(msg ?? 'Failed to send message (400).');
          }
        }
        final msg = _extractDjangoError(body);
        if (msg != null) throw Exception(msg);
      }
      rethrow;
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

  Future<MessageModel> sendSupportMessage(String content) async {
    if (content.trim().isEmpty) {
      throw Exception('Cannot send an empty message.');
    }
    try {
      final res = await ApiService.post(
        '/messages/support/',
        data: {'content': content.trim()},
      );
      return MessageModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final msg = _extractDjangoError(e.response?.data);
      if (msg != null) throw Exception(msg);
      rethrow;
    }
  }

  // ── Helper: turn a Django error response body into a human-readable string ─
  static String? _extractDjangoError(dynamic body) {
    if (body == null) return null;
    if (body is String && body.isNotEmpty) return body;
    if (body is Map) {
      final parts = <String>[];
      for (final entry in body.entries) {
        final v = entry.value;
        if (v is List) {
          parts.add(v.map((e) => e.toString()).join(' '));
        } else if (v is String) {
          parts.add(v);
        }
      }
      if (parts.isNotEmpty) return parts.join('\n');
    }
    return null;
  }
}
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
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
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
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list
        .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Send a message ─────────────────────────────────────────────────────────
  Future<MessageModel> sendMessage({
    required String bookingId,
    required String receiverId,
    required String content,
  }) async {
    final res = await ApiService.post('/messages/', data: {
      'booking':    bookingId,
      'receiver':   receiverId,
      'content':    content,
    });
    return MessageModel.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Support thread (no booking) ────────────────────────────────────────────
  Future<List<MessageModel>> getSupportMessages() async {
    final res = await ApiService.get('/messages/support/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list
        .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<MessageModel> sendSupportMessage(String content) async {
    final res = await ApiService.post('/messages/support/',
        data: {'content': content});
    return MessageModel.fromJson(res.data as Map<String, dynamic>);
  }
}
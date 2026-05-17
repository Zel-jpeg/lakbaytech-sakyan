import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/message_repository.dart';
import '../models/message_model.dart';

final messageRepositoryProvider =
    Provider<MessageRepository>((_) => const MessageRepository());

// ── Conversations list ────────────────────────────────────────────────────────
final conversationsProvider =
    FutureProvider<List<ConversationModel>>((ref) async {
  return ref.read(messageRepositoryProvider).getConversations();
});

// ── Messages for one booking ──────────────────────────────────────────────────
class ChatNotifier extends FamilyAsyncNotifier<List<MessageModel>, String> {
  @override
  Future<List<MessageModel>> build(String bookingId) async {
    return ref.read(messageRepositoryProvider).getMessages(bookingId);
  }

  Future<void> send({
    required String receiverId,
    required String content,
    String? imageUrl,
  }) async {
    final bookingId = arg;
    final current = state.value ?? [];
    final msg = await ref
        .read(messageRepositoryProvider)
        .sendMessage(
          bookingId:  bookingId,
          receiverId: receiverId,
          content:    content,
          imageUrl:   imageUrl,
        );
    state = AsyncValue.data([...current, msg]);
    ref.invalidate(conversationsProvider);
  }

  /// Silent background refresh — does NOT set loading state so the UI
  /// never flashes back to a spinner during the auto-poll timer.
  Future<void> silentRefresh() async {
    try {
      final messages = await ref
          .read(messageRepositoryProvider)
          .getMessages(arg);
      // Only update state if the message count or latest id changed
      final current = state.value;
      if (current == null ||
          current.length != messages.length ||
          (messages.isNotEmpty &&
              current.isNotEmpty &&
              messages.last.id != current.last.id)) {
        state = AsyncValue.data(messages);
      }
    } catch (_) {
      // Silently ignore poll errors — the user still sees the last messages
    }
  }

  /// Full refresh with loading indicator — use for manual "retry" only.
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(messageRepositoryProvider).getMessages(arg));
  }
}

final chatProvider =
    AsyncNotifierProviderFamily<ChatNotifier, List<MessageModel>, String>(
        ChatNotifier.new);

/// Unread conversations count — used for bottom-nav badge.
final unreadConversationsCountProvider = Provider<int>((ref) {
  return ref
          .watch(conversationsProvider)
          .value
          ?.fold<int>(0, (sum, c) => sum + c.unreadCount) ??
      0;
});

// ── Inquiry chat (pre-booking, no booking ID required) ───────────────────────
// Parameterized by partnerUserId.
class InquiryChatNotifier
    extends FamilyAsyncNotifier<List<MessageModel>, String> {
  @override
  Future<List<MessageModel>> build(String partnerUserId) async {
    return ref
        .read(messageRepositoryProvider)
        .getInquiryMessages(partnerUserId);
  }

  Future<void> send({
    required String carId,
    required String content,
    String? imageUrl,
    String? customerId,   // used by partner when replying (carId will be empty)
  }) async {
    final current = state.value ?? [];
    final msg = await ref.read(messageRepositoryProvider).sendInquiry(
          carId:      carId,
          content:    content,
          imageUrl:   imageUrl,
          customerId: customerId,
        );
    state = AsyncValue.data([...current, msg]);
    ref.invalidate(conversationsProvider);
  }

  Future<void> silentRefresh(String partnerUserId) async {
    try {
      final messages = await ref
          .read(messageRepositoryProvider)
          .getInquiryMessages(partnerUserId);
      final current = state.value;
      if (current == null ||
          current.length != messages.length ||
          (messages.isNotEmpty &&
              current.isNotEmpty &&
              messages.last.id != current.last.id)) {
        state = AsyncValue.data(messages);
      }
    } catch (_) {}
  }
}

final inquiryChatProvider = AsyncNotifierProviderFamily<
    InquiryChatNotifier, List<MessageModel>, String>(InquiryChatNotifier.new);
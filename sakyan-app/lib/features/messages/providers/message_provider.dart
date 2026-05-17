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

// ── Inquiry chat (pre-booking) ─────────────────────────────────────────────────
// Family key = partnerId (Partner table PK, UUID string)
class InquiryChatNotifier
    extends FamilyAsyncNotifier<List<MessageModel>, String> {
  @override
  Future<List<MessageModel>> build(String partnerId) async {
    return ref.read(messageRepositoryProvider).getInquiryMessages(partnerId);
  }

  /// Send the very first message (no prior thread exists).
  Future<void> sendFirst({
    required String content,
    String? imageUrl,
  }) async {
    final current = state.value ?? [];
    final msg = await ref
        .read(messageRepositoryProvider)
        .sendInquiry(partnerId: arg, content: content, imageUrl: imageUrl);
    state = AsyncValue.data([...current, msg]);
    ref.invalidate(conversationsProvider);
  }

  /// Reply to an existing thread.
  Future<void> reply({
    required String receiverId,
    required String content,
    String? imageUrl,
  }) async {
    final current = state.value ?? [];
    final msg = await ref
        .read(messageRepositoryProvider)
        .sendInquiryReply(
          partnerId:  arg,
          receiverId: receiverId,
          content:    content,
          imageUrl:   imageUrl,
        );
    state = AsyncValue.data([...current, msg]);
    ref.invalidate(conversationsProvider);
  }

  Future<void> silentRefresh() async {
    try {
      final messages =
          await ref.read(messageRepositoryProvider).getInquiryMessages(arg);
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

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
        () => ref.read(messageRepositoryProvider).getInquiryMessages(arg));
  }
}

final inquiryChatProvider = AsyncNotifierProviderFamily<InquiryChatNotifier,
    List<MessageModel>, String>(InquiryChatNotifier.new);
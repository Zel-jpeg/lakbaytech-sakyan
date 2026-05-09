import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notification_repository.dart';
import '../models/notification_model.dart';

final notificationRepositoryProvider =
    Provider<NotificationRepository>((_) => const NotificationRepository());

// ── Notifications list ────────────────────────────────────────────────────────
class NotificationsNotifier
    extends AsyncNotifier<List<NotificationModel>> {
  @override
  Future<List<NotificationModel>> build() async {
    return ref
        .read(notificationRepositoryProvider)
        .getNotifications();
  }

  Future<void> markAllRead() async {
    await ref.read(notificationRepositoryProvider).markAllRead();
    // Optimistically update local state
    final current = state.value ?? [];
    state = AsyncValue.data(
        current.map((n) => n.copyWith(isRead: true)).toList());
  }

  Future<void> markRead(String id) async {
    await ref.read(notificationRepositoryProvider).markRead(id);
    final current = state.value ?? [];
    state = AsyncValue.data(
      current.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(notificationRepositoryProvider).getNotifications());
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier,
        List<NotificationModel>>(NotificationsNotifier.new);

/// Unread count — used for badge on bottom nav / bell icon.
final unreadNotificationCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).value
          ?.where((n) => !n.isRead)
          .length ??
      0;
});
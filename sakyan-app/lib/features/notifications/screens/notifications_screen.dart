import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final unreadBg    = isDark
        ? AppColors.primary.withOpacity(0.07)
        : AppColors.primary.withOpacity(0.04);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          notifAsync.maybeWhen(
            data: (notifs) {
              final hasUnread = notifs.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: () =>
                    ref.read(notificationsProvider.notifier).markAllRead(),
                child: const Text('Mark all read',
                    style: TextStyle(
                        color: AppColors.primary, fontSize: 13)),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: notifAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
              const SizedBox(height: 12),
              Text('Failed to load notifications',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.read(notificationsProvider.notifier).refresh(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (notifs) {
          if (notifs.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_off_rounded,
                      size: 72, color: textMuted),
                  const SizedBox(height: 16),
                  Text('No notifications yet',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: textMuted)),
                  const SizedBox(height: 6),
                  Text("You're all caught up!",
                      style: TextStyle(color: textMuted, fontSize: 13)),
                ],
              ),
            );
          }

          // Group by date
          final grouped = _groupByDate(notifs);

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () =>
                ref.read(notificationsProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: grouped.length,
              itemBuilder: (_, i) {
                final entry = grouped[i];
                if (entry is String) {
                  // Date header
                  return Padding(
                    padding: const EdgeInsets.only(top: 16, bottom: 8),
                    child: Text(entry,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: textMuted,
                            letterSpacing: 0.5)),
                  );
                }
                final n = entry as NotificationModel;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _NotificationTile(
                    notification: n,
                    cardColor:   cardColor,
                    borderColor: borderColor,
                    textPrim:    textPrim,
                    textSec:     textSec,
                    textMuted:   textMuted,
                    unreadBg:    unreadBg,
                    onTap: () {
                      if (!n.isRead) {
                        ref
                            .read(notificationsProvider.notifier)
                            .markRead(n.id);
                      }
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  /// Interleave date-string headers with notifications.
  List<dynamic> _groupByDate(List<NotificationModel> notifs) {
    final result = <dynamic>[];
    String? lastDate;
    final now   = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yest  = today.subtract(const Duration(days: 1));

    for (final n in notifs) {
      final d = DateTime(
          n.createdAt.year, n.createdAt.month, n.createdAt.day);
      String label;
      if (d == today) {
        label = 'Today';
      } else if (d == yest) {
        label = 'Yesterday';
      } else {
        label = DateFormat('MMMM d, yyyy').format(d);
      }

      if (label != lastDate) {
        result.add(label);
        lastDate = label;
      }
      result.add(n);
    }
    return result;
  }
}

// ── Notification tile ─────────────────────────────────────────────────────────
class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final Color cardColor, borderColor, textPrim, textSec, textMuted, unreadBg;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
    required this.unreadBg,
    required this.onTap,
  });

  // Map notification type → icon & color
  (IconData, Color) _iconForType(String type) {
    switch (type) {
      case 'booking_approved':
        return (Icons.check_circle_rounded, AppColors.success);
      case 'booking_rejected':
        return (Icons.cancel_rounded, AppColors.error);
      case 'booking_pending':
      case 'booking_created':
        return (Icons.pending_rounded, AppColors.warning);
      case 'booking_active':
        return (Icons.directions_car_rounded, AppColors.info);
      case 'booking_completed':
        return (Icons.flag_rounded, AppColors.statusCompleted);
      case 'booking_cancelled':
        return (Icons.block_rounded, AppColors.statusCancelled);
      case 'payment':
        return (Icons.payments_rounded, AppColors.success);
      case 'message':
        return (Icons.chat_bubble_rounded, AppColors.info);
      case 'kyc_approved':
        return (Icons.verified_user_rounded, AppColors.success);
      case 'kyc_rejected':
        return (Icons.gpp_bad_rounded, AppColors.error);
      default:
        return (Icons.notifications_rounded, AppColors.primary);
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1)  return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours   < 24) return '${diff.inHours}h ago';
    return DateFormat('MMM d').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final (icon, color) = _iconForType(notification.type);
    final isUnread = !notification.isRead;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUnread ? unreadBg : cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isUnread
                ? AppColors.primary.withOpacity(0.25)
                : borderColor,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon badge
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withOpacity(0.3)),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: textPrim,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _timeAgo(notification.createdAt),
                        style: TextStyle(fontSize: 11, color: textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: TextStyle(
                        fontSize: 12, color: textSec, height: 1.5),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Unread dot
            if (isUnread) ...[
              const SizedBox(width: 8),
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
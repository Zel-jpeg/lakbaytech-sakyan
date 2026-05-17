import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../messages/models/message_model.dart';
import '../../messages/providers/message_provider.dart';

class PartnerInboxScreen extends ConsumerWidget {
  const PartnerInboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convAsync = ref.watch(conversationsProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Messages'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: textPrim),
            onPressed: () => ref.invalidate(conversationsProvider),
          ),
        ],
      ),
      body: convAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, st) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.10),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.cloud_off_rounded,
                      color: AppColors.error, size: 32),
                ),
                const SizedBox(height: 16),
                Text('Failed to load messages',
                    style: TextStyle(
                        color: textPrim,
                        fontWeight: FontWeight.w700,
                        fontSize: 16)),
                const SizedBox(height: 8),
                Text(
                  e.toString().replaceFirst('Exception: ', ''),
                  style: TextStyle(color: textMuted, fontSize: 12),
                  textAlign: TextAlign.center,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Retry'),
                  onPressed: () => ref.invalidate(conversationsProvider),
                ),
              ],
            ),
          ),
        ),
        data: (convs) {
          if (convs.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGlow,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.chat_bubble_outline_rounded,
                        color: AppColors.primary, size: 42),
                  ),
                  const SizedBox(height: 18),
                  Text('No messages yet',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 6),
                  Text('Customer conversations will appear here.',
                      style: TextStyle(color: textMuted, fontSize: 13),
                      textAlign: TextAlign.center),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(conversationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: convs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _ConvTile(
                conv:        convs[i],
                cardColor:   cardColor,
                borderColor: borderColor,
                textPrim:    textPrim,
                textSec:     textSec,
                textMuted:   textMuted,
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Conversation tile ─────────────────────────────────────────────────────────
class _ConvTile extends StatelessWidget {
  final ConversationModel conv;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _ConvTile({
    required this.conv,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.textMuted,
  });

  String _formatTime(DateTime dt) {
    final now   = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d     = DateTime(dt.year, dt.month, dt.day);
    if (d == today) return DateFormat('h:mm a').format(dt);
    if (today.difference(d).inDays == 1) return 'Yesterday';
    return DateFormat('MMM d').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final c = conv;
    final hasUnread = c.unreadCount > 0;
    final initials = c.otherUserName.isNotEmpty
        ? c.otherUserName
            .trim()
            .split(' ')
            .map((w) => w[0])
            .take(2)
            .join()
            .toUpperCase()
        : '?';

    return GestureDetector(
      onTap: () => context.push(
        '/chat/${c.bookingId}',
        extra: {
          'receiverId': c.otherUserId,
          'name':       c.otherUserName,
          'carName':    c.carName,
        },
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: hasUnread
              ? AppColors.primary.withOpacity(0.05)
              : cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasUnread
                ? AppColors.primary.withOpacity(0.25)
                : borderColor,
          ),
        ),
        child: Row(children: [
          // Avatar
          Stack(children: [
            c.otherUserAvatar.isNotEmpty
                ? ClipOval(
                    child: Image.network(
                      c.otherUserAvatar,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _AvatarFallback(initials: initials),
                    ),
                  )
                : _AvatarFallback(initials: initials),
            if (hasUnread)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                      color: AppColors.primary, shape: BoxShape.circle),
                  child: Center(
                    child: Text(
                      c.unreadCount > 9 ? '9+' : '${c.unreadCount}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ),
          ]),
          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        c.otherUserName.isNotEmpty
                            ? c.otherUserName
                            : 'Customer',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: hasUnread
                              ? FontWeight.w700
                              : FontWeight.w600,
                          color: textPrim,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      _formatTime(c.lastMessageAt),
                      style: TextStyle(
                        fontSize: 11,
                        color: hasUnread ? AppColors.primary : textMuted,
                        fontWeight: hasUnread
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ],
                ),
                if (c.carName.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(children: [
                    const Icon(Icons.directions_car_rounded,
                        size: 10, color: AppColors.primary),
                    const SizedBox(width: 3),
                    Text(c.carName,
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500)),
                  ]),
                ],
                const SizedBox(height: 2),
                Text(
                  c.lastMessage.isNotEmpty
                      ? c.lastMessage
                      : 'No messages yet',
                  style: TextStyle(
                    fontSize: 12,
                    color: hasUnread ? textSec : textMuted,
                    fontWeight:
                        hasUnread ? FontWeight.w500 : FontWeight.w400,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

class _AvatarFallback extends StatelessWidget {
  final String initials;
  const _AvatarFallback({required this.initials});

  @override
  Widget build(BuildContext context) => Container(
        width: 48,
        height: 48,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: Text(initials,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700)),
        ),
      );
}
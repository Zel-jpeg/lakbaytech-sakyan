import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../models/message_model.dart';
import '../providers/message_provider.dart';

class InboxScreen extends ConsumerWidget {
  const InboxScreen({super.key});

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
      appBar: AppBar(title: const Text('Messages')),
      body: convAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
              const SizedBox(height: 12),
              Text('Failed to load messages',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(conversationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (convs) {
          if (convs.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded,
                      size: 72, color: textMuted),
                  const SizedBox(height: 16),
                  Text('No conversations yet',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: textMuted)),
                  const SizedBox(height: 6),
                  Text('Messages with partners will appear here.',
                      style: TextStyle(color: textMuted, fontSize: 13),
                      textAlign: TextAlign.center),
                ],
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async =>
                ref.invalidate(conversationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              itemCount: convs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _ConversationTile(
                conversation: convs[i],
                cardColor:    cardColor,
                borderColor:  borderColor,
                textPrim:     textPrim,
                textSec:      textSec,
                textMuted:    textMuted,
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Conversation tile ─────────────────────────────────────────────────────────
class _ConversationTile extends StatelessWidget {
  final ConversationModel conversation;
  final Color cardColor, borderColor, textPrim, textSec, textMuted;

  const _ConversationTile({
    required this.conversation,
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
    final c = conversation;
    final hasUnread   = c.unreadCount > 0;
    final isSupport   = c.isSupport;

    // Display name: Sakyan Support for support thread, partner name otherwise
    final displayName = isSupport
        ? 'Sakyan Support'
        : (c.otherUserName.isNotEmpty ? c.otherUserName : 'Partner');

    final initials = isSupport
        ? 'S'
        : (c.otherUserName.isNotEmpty
            ? c.otherUserName
                .trim()
                .split(' ')
                .map((w) => w[0])
                .take(2)
                .join()
                .toUpperCase()
            : 'P');

    return GestureDetector(
      onTap: () {
        if (isSupport) {
          // Navigate to support chat (special route with no booking ID)
          context.push('/support-chat');
        } else {
          context.push('/chat/${c.bookingId}',
              extra: {
                'receiverId': c.otherUserId,
                'name': c.otherUserName,
                'carName': c.carName,
              });
        }
      },
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
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                if (isSupport)
                  // Sakyan Support avatar — shield icon
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shield_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  )
                else if (c.otherUserAvatar.isNotEmpty)
                  ClipOval(
                    child: Image.network(
                      c.otherUserAvatar,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _AvatarFallback(initials: initials),
                    ),
                  )
                else
                  _AvatarFallback(initials: initials),
                if (hasUnread)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
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
              ],
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                displayName,
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
                            if (isSupport) ...{
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Support',
                                  style: TextStyle(
                                    fontSize: 9,
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            },
                          ],
                        ),
                      ),
                      Text(
                        _formatTime(c.lastMessageAt),
                        style: TextStyle(
                          fontSize: 11,
                          color: hasUnread
                              ? AppColors.primary
                              : textMuted,
                          fontWeight: hasUnread
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  if (!isSupport && c.carName.isNotEmpty)
                    Text(c.carName,
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500)),
                  if (isSupport)
                    Text('Ask questions or report issues',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.primary.withOpacity(0.7),
                            fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(
                    c.lastMessage.isNotEmpty
                        ? c.lastMessage
                        : 'No messages yet',
                    style: TextStyle(
                      fontSize: 12,
                      color: hasUnread ? textSec : textMuted,
                      fontWeight: hasUnread
                          ? FontWeight.w500
                          : FontWeight.w400,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
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
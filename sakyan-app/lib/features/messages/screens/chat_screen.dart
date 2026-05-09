import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/message_model.dart';
import '../providers/message_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String bookingId;
  final String? receiverId;
  final String? receiverName;
  final String? carName;

  const ChatScreen({
    super.key,
    required this.bookingId,
    this.receiverId,
    this.receiverName,
    this.carName,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _msgCtrl    = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _pollTimer;
  bool _sending     = false;

  String? get _receiverId   => widget.receiverId;
  String? get _receiverName => widget.receiverName;

  @override
  void initState() {
    super.initState();
    // Poll every 5 seconds for new messages
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      ref.read(chatProvider(widget.bookingId).notifier).refresh();
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _scrollToBottom({bool animated = false}) {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      if (animated) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      } else {
        _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    if (_receiverId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot determine recipient.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _sending = true);
    _msgCtrl.clear();
    try {
      await ref.read(chatProvider(widget.bookingId).notifier).send(
            receiverId: _receiverId!,
            content:    text,
          );
      _scrollToBottom(animated: true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to send message.'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _msgCtrl.text = text; // restore
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatProvider(widget.bookingId));
    final currentUser   = ref.watch(currentUserProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final inputBg     = isDark ? AppColors.bgSurface     : AppColors.bgSurfaceLight;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _receiverName ?? 'Partner',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: textPrim),
            ),
            if (widget.carName?.isNotEmpty == true)
              Text(
                widget.carName!,
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500),
              ),
          ],
        ),
        actions: [
          // Manual refresh
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: textSec),
            tooltip: 'Refresh',
            onPressed: () =>
                ref.read(chatProvider(widget.bookingId).notifier).refresh(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Messages list ──────────────────────────────────────────────
          Expanded(
            child: messagesAsync.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primary)),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline_rounded,
                        size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load messages',
                        style: TextStyle(color: textMuted)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref
                          .read(chatProvider(widget.bookingId).notifier)
                          .refresh(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (messages) {
                // Auto-scroll when new messages arrive
                _scrollToBottom();

                if (messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.chat_bubble_outline_rounded,
                            size: 64, color: textMuted),
                        const SizedBox(height: 12),
                        Text('No messages yet',
                            style: TextStyle(
                                color: textMuted, fontSize: 15)),
                        const SizedBox(height: 4),
                        Text('Say hello to get started!',
                            style: TextStyle(
                                color: textMuted, fontSize: 13)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding:
                      const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final msg     = messages[i];
                    final isMe    = msg.senderId == currentUser?.id;
                    final showTime = i == 0 ||
                        messages[i].createdAt
                                .difference(messages[i - 1].createdAt)
                                .inMinutes
                                .abs() >
                            10;
                    return Column(
                      children: [
                        if (showTime)
                          _TimeDivider(
                              time: msg.createdAt,
                              textMuted: textMuted),
                        _MessageBubble(
                          message:      msg,
                          isMe:         isMe,
                          cardColor:    cardColor,
                          textPrim:     textPrim,
                          textMuted:    textMuted,
                          isDark:       isDark,
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),

          // ── Input bar ──────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(
                16,
                10,
                16,
                MediaQuery.of(context).padding.bottom + 10),
            decoration: BoxDecoration(
              color:  cardColor,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color:        inputBg,
                      borderRadius: BorderRadius.circular(22),
                      border:       Border.all(color: borderColor),
                    ),
                    child: TextField(
                      controller: _msgCtrl,
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      style: TextStyle(color: textPrim, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle:
                            TextStyle(color: textMuted, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _sending ? null : _send,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _sending
                          ? AppColors.primary.withOpacity(0.5)
                          : AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: _sending
                        ? const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white),
                            ),
                          )
                        : const Icon(Icons.send_rounded,
                            color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Message bubble ────────────────────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe, isDark;
  final Color cardColor, textPrim, textMuted;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.isDark,
    required this.cardColor,
    required this.textPrim,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    final bubbleBg = isMe
        ? AppColors.primary
        : cardColor;
    final textColor = isMe ? Colors.white : textPrim;
    final timeColor = isMe
        ? Colors.white.withOpacity(0.65)
        : textMuted;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4,
          bottom: 4,
          left:  isMe ? 48 : 0,
          right: isMe ? 0  : 48,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bubbleBg,
          borderRadius: BorderRadius.only(
            topLeft:     Radius.circular(isMe ? 16 : 4),
            topRight:    Radius.circular(isMe ? 4 : 16),
            bottomLeft:  const Radius.circular(16),
            bottomRight: const Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.2 : 0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isMe && message.senderName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  message.senderName,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            Text(
              message.content,
              style: TextStyle(
                  color: textColor, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('h:mm a').format(message.createdAt),
                  style: TextStyle(fontSize: 10, color: timeColor),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    message.isRead
                        ? Icons.done_all_rounded
                        : Icons.done_rounded,
                    size: 13,
                    color: timeColor,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Time divider ──────────────────────────────────────────────────────────────
class _TimeDivider extends StatelessWidget {
  final DateTime time;
  final Color textMuted;
  const _TimeDivider({required this.time, required this.textMuted});

  @override
  Widget build(BuildContext context) {
    final now   = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d     = DateTime(time.year, time.month, time.day);

    String label;
    if (d == today) {
      label = 'Today ${DateFormat('h:mm a').format(time)}';
    } else if (today.difference(d).inDays == 1) {
      label = 'Yesterday ${DateFormat('h:mm a').format(time)}';
    } else {
      label = DateFormat('MMM d, h:mm a').format(time);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        Expanded(
            child: Divider(color: textMuted.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(label,
              style: TextStyle(fontSize: 11, color: textMuted)),
        ),
        Expanded(
            child: Divider(color: textMuted.withOpacity(0.3))),
      ]),
    );
  }
}
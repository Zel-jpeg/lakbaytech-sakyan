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

  String? _resolvedReceiverId;
  String? _resolvedReceiverName;

  /// Use the widget's receiverId only if it's a non-empty string.
  /// Fall back to the resolved one from message history.
  String? get _receiverId {
    final wid = widget.receiverId;
    if (wid != null && wid.isNotEmpty) return wid;
    return _resolvedReceiverId;
  }

  String? get _receiverName {
    final wn = widget.receiverName;
    if (wn != null && wn.isNotEmpty) return wn;
    return _resolvedReceiverName;
  }

  bool get _hasValidReceiver =>
      _receiverId != null && _receiverId!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    // ── Silent poll every 5 s — no loading spinner ──────────────────────────
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref.read(chatProvider(widget.bookingId).notifier).silentRefresh();
      }
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  /// Try to figure out who the other party is from message history.
  /// This is a fallback when receiverId was not passed (e.g. opened from inbox).
  void _tryResolveReceiver(List<MessageModel> messages, String? currentUserId) {
    if (_hasValidReceiver) return;
    if (currentUserId == null) return;
    for (final m in messages) {
      if (m.senderId.isNotEmpty && m.senderId != currentUserId) {
        if (mounted) {
          setState(() {
            _resolvedReceiverId   = m.senderId;
            _resolvedReceiverName = m.senderName;
          });
        }
        return;
      }
      if (m.receiverId.isNotEmpty && m.receiverId != currentUserId) {
        if (mounted) {
          setState(() {
            _resolvedReceiverId   = m.receiverId;
            _resolvedReceiverName = m.receiverName;
          });
        }
        return;
      }
    }
  }

  void _scrollToBottom({bool animated = false}) {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      final max = _scrollCtrl.position.maxScrollExtent;
      if (animated) {
        _scrollCtrl.animateTo(max,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      } else {
        _scrollCtrl.jumpTo(max);
      }
    });
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;

    // Guard: receiver must be a non-empty UUID
    if (!_hasValidReceiver) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Cannot determine recipient. Please go back and open the chat '
            'from your booking details.',
          ),
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
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _msgCtrl.text = text; // restore unsent text
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

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final inputBg     = isDark ? AppColors.bgSurface     : AppColors.bgSurfaceLight;

    // Try to resolve receiver from messages if not passed as param
    messagesAsync.whenData(
      (messages) => _tryResolveReceiver(messages, currentUser?.id),
    );

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            // Avatar circle with first letter of receiver name
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Text(
                  (_receiverName ?? 'U').isNotEmpty
                      ? (_receiverName ?? 'U')[0].toUpperCase()
                      : 'U',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _receiverName ?? 'Chat',
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
          ],
        ),
        actions: [
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
          // ── Receiver-unknown warning banner ──────────────────────────────
          if (!_hasValidReceiver && messagesAsync.hasValue)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.warning.withOpacity(0.12),
              child: Row(children: [
                const Icon(Icons.warning_rounded,
                    color: AppColors.warning, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Recipient info unavailable — send a message first '
                    'or open this chat from your booking.',
                    style: const TextStyle(
                        color: AppColors.warning, fontSize: 12),
                  ),
                ),
              ]),
            ),

          // ── Messages list ────────────────────────────────────────────────
          Expanded(
            child: messagesAsync.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
              error: (e, st) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load messages',
                        style: TextStyle(
                            color: textMuted,
                            fontWeight: FontWeight.w600,
                            fontSize: 15)),
                    const SizedBox(height: 6),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        e.toString().replaceFirst('Exception: ', ''),
                        style: TextStyle(color: textMuted, fontSize: 12),
                        textAlign: TextAlign.center,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text('Retry'),
                      onPressed: () => ref
                          .read(chatProvider(widget.bookingId).notifier)
                          .refresh(),
                    ),
                  ],
                ),
              ),
              data: (messages) {
                _scrollToBottom();

                if (messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGlow,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.chat_bubble_outline_rounded,
                              color: AppColors.primary, size: 38),
                        ),
                        const SizedBox(height: 16),
                        Text('No messages yet',
                            style: TextStyle(
                                color: textMuted,
                                fontSize: 15,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('Send a message to get started!',
                            style: TextStyle(color: textMuted, fontSize: 13)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final msg  = messages[i];
                    final isMe = msg.senderId == currentUser?.id;
                    final showTime = i == 0 ||
                        messages[i]
                                .createdAt
                                .difference(messages[i - 1].createdAt)
                                .inMinutes
                                .abs() >
                            10;
                    return Column(
                      children: [
                        if (showTime)
                          _TimeDivider(
                              time: msg.createdAt, textMuted: textMuted),
                        _MessageBubble(
                          message:   msg,
                          isMe:      isMe,
                          cardColor: cardColor,
                          textPrim:  textPrim,
                          textMuted: textMuted,
                          isDark:    isDark,
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),

          // ── Input bar ────────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(
                16, 10, 16, MediaQuery.of(context).padding.bottom + 10),
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
                        hintText: _hasValidReceiver
                            ? 'Type a message...'
                            : 'Resolve recipient first...',
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
                      color: (_sending || !_hasValidReceiver)
                          ? AppColors.primary.withOpacity(0.4)
                          : AppColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: _hasValidReceiver
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : [],
                    ),
                    child: _sending
                        ? const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
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

// ── Message bubble ─────────────────────────────────────────────────────────────
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
    final bubbleBg  = isMe ? AppColors.primary : cardColor;
    final textColor = isMe ? Colors.white : textPrim;
    final timeColor = isMe ? Colors.white.withOpacity(0.65) : textMuted;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4, bottom: 4,
          left:  isMe ? 56 : 0,
          right: isMe ? 0  : 56,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bubbleBg,
          borderRadius: BorderRadius.only(
            topLeft:     Radius.circular(isMe ? 18 : 4),
            topRight:    Radius.circular(isMe ? 4 : 18),
            bottomLeft:  const Radius.circular(18),
            bottomRight: const Radius.circular(18),
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
                      fontWeight: FontWeight.w600),
                ),
              ),
            Text(message.content,
                style:
                    TextStyle(color: textColor, fontSize: 14, height: 1.4)),
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

// ── Time divider ───────────────────────────────────────────────────────────────
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
      label = 'Today  ${DateFormat('h:mm a').format(time)}';
    } else if (today.difference(d).inDays == 1) {
      label = 'Yesterday  ${DateFormat('h:mm a').format(time)}';
    } else {
      label = DateFormat('MMM d,  h:mm a').format(time);
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
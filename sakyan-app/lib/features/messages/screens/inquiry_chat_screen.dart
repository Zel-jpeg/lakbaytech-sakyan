import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/message_model.dart';
import '../providers/message_provider.dart';

// ─────────────────────────────────────────────────────────────────────────────
// InquiryChatScreen
//
// Pre-booking inquiry chat between a customer and a partner.
// Navigated to from CarDetailScreen with:
//   context.push('/inquiry-chat', extra: {
//     'partnerId':   car.partnerId,
//     'partnerName': car.partnerName,
//   })
// Also navigated to from InboxScreen when tapping an inquiry conversation.
// ─────────────────────────────────────────────────────────────────────────────

class InquiryChatScreen extends ConsumerStatefulWidget {
  /// Partner table PK (UUID) — used to call /messages/inquiry/?partner_id=
  final String partnerId;

  /// Display name shown in the AppBar (partner's business name)
  final String partnerName;

  /// otherUserId from the conversation — used when replying (non-null once
  /// the first message exists). Null on a brand-new thread.
  final String? receiverId;

  const InquiryChatScreen({
    super.key,
    required this.partnerId,
    required this.partnerName,
    this.receiverId,
  });

  @override
  ConsumerState<InquiryChatScreen> createState() => _InquiryChatScreenState();
}

class _InquiryChatScreenState extends ConsumerState<InquiryChatScreen> {
  final _msgCtrl    = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _pollTimer;
  bool  _sending   = false;
  bool  _uploading = false;

  XFile?     _pickedImage;
  Uint8List? _pickedImageBytes;

  // The receiver UUID resolved from the first server message once it arrives.
  // We start with what was passed in (may be null for new threads).
  String? _resolvedReceiverId;

  @override
  void initState() {
    super.initState();
    _resolvedReceiverId = widget.receiverId;
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref
            .read(inquiryChatProvider(widget.partnerId).notifier)
            .silentRefresh();
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

  void _scrollToBottom({bool animated = false}) {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!_scrollCtrl.hasClients) return;
      final max = _scrollCtrl.position.maxScrollExtent;
      if (animated) {
        _scrollCtrl.animateTo(max,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut);
      } else {
        _scrollCtrl.jumpTo(max);
      }
    });
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.gallery);
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (mounted) {
        setState(() {
          _pickedImage      = picked;
          _pickedImageBytes = bytes;
        });
      }
    } catch (e) {
      if (mounted) _showError('Could not pick image: $e');
    }
  }

  void _clearImage() => setState(() {
        _pickedImage      = null;
        _pickedImageBytes = null;
      });

  Future<String?> _uploadImage() async {
    if (_pickedImage == null || _pickedImageBytes == null) return null;
    setState(() => _uploading = true);
    try {
      final fileName = 'chat/${DateTime.now().millisecondsSinceEpoch}.jpg';
      return await SupabaseService.uploadChatImage(fileName, _pickedImageBytes!);
    } catch (e) {
      if (mounted) _showError('Image upload failed: $e');
      return null;
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
    ));
  }

  Future<void> _send() async {
    final text       = _msgCtrl.text.trim();
    final hasImage   = _pickedImage != null;
    final hasContent = text.isNotEmpty || hasImage;
    if (!hasContent || _sending || _uploading) return;

    setState(() => _sending = true);
    final savedText = text;
    _msgCtrl.clear();

    String? imageUrl;
    if (hasImage) {
      imageUrl = await _uploadImage();
      if (imageUrl == null && savedText.isEmpty) {
        if (mounted) {
          _msgCtrl.text = savedText;
          setState(() => _sending = false);
        }
        return;
      }
      _clearImage();
    }

    try {
      final notifier =
          ref.read(inquiryChatProvider(widget.partnerId).notifier);

      if (_resolvedReceiverId != null && _resolvedReceiverId!.isNotEmpty) {
        // Existing thread — reply
        await notifier.reply(
          receiverId: _resolvedReceiverId!,
          content:    savedText,
          imageUrl:   imageUrl,
        );
      } else {
        // Brand-new thread — send first message
        await notifier.sendFirst(content: savedText, imageUrl: imageUrl);
        // After first send, refresh to resolve the receiver from new messages
        await notifier.silentRefresh();
        _resolveReceiver();
      }
      _scrollToBottom(animated: true);
    } catch (e) {
      if (mounted) {
        _showError(
            'Failed to send: ${e.toString().replaceFirst('Exception: ', '')}');
        _msgCtrl.text = savedText;
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  /// After the first message is sent, resolve the receiverId from the messages
  /// so subsequent messages go through the reply endpoint.
  void _resolveReceiver() {
    final msgs = ref.read(inquiryChatProvider(widget.partnerId)).value ?? [];
    final currentUserId = ref.read(currentUserProvider)?.id ?? '';
    for (final m in msgs) {
      if (m.senderId != currentUserId && m.senderId.isNotEmpty) {
        setState(() => _resolvedReceiverId = m.senderId);
        return;
      }
      if (m.receiverId != currentUserId && m.receiverId.isNotEmpty) {
        setState(() => _resolvedReceiverId = m.receiverId);
        return;
      }
    }
  }

  void _showFullScreenImage(String url) {
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          fit: StackFit.expand,
          children: [
            InteractiveViewer(
              panEnabled: true,
              minScale: 0.5,
              maxScale: 5.0,
              child: Center(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  loadingBuilder: (_, child, p) =>
                      p == null ? child : const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 64),
                ),
              ),
            ),
            Positioned(
              top: 48, right: 16,
              child: GestureDetector(
                onTap: () => Navigator.of(context, rootNavigator: true).pop(),
                child: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white30)),
                  child: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final msgsAsync   = ref.watch(inquiryChatProvider(widget.partnerId));
    final currentUser = ref.watch(currentUserProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface  : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border      : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final textMuted   = isDark ? AppColors.textMuted   : AppColors.textMutedLight;

    // Resolve receiver from messages if not yet known
    msgsAsync.whenData((msgs) {
      if (_resolvedReceiverId == null || _resolvedReceiverId!.isEmpty) {
        final myId = currentUser?.id ?? '';
        for (final m in msgs) {
          if (m.senderId != myId && m.senderId.isNotEmpty) {
            _resolvedReceiverId = m.senderId;
            break;
          }
          if (m.receiverId != myId && m.receiverId.isNotEmpty) {
            _resolvedReceiverId = m.receiverId;
            break;
          }
        }
      }
    });

    final initials = widget.partnerName.trim().isEmpty
        ? 'P'
        : widget.partnerName
            .trim()
            .split(' ')
            .map((w) => w[0])
            .take(2)
            .join()
            .toUpperCase();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (context.canPop()) context.pop();
            else context.go('/');
          },
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            // Indigo avatar for inquiry threads
            Container(
              width: 36, height: 36,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF7C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Text(initials,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.partnerName.isEmpty ? 'Partner' : widget.partnerName,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: textPrim),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Text(
                    'Pre-booking inquiry',
                    style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6366F1),
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: textMuted),
            tooltip: 'Refresh',
            onPressed: () =>
                ref.read(inquiryChatProvider(widget.partnerId).notifier).refresh(),
          ),
        ],
      ),

      body: Column(
        children: [
          // ── Messages ──────────────────────────────────────────────────────
          Expanded(
            child: msgsAsync.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load messages',
                        style: TextStyle(color: textMuted, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text('Retry'),
                      onPressed: () =>
                          ref.read(inquiryChatProvider(widget.partnerId).notifier).refresh(),
                    ),
                  ],
                ),
              ),
              data: (messages) {
                _scrollToBottom();
                if (messages.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72, height: 72,
                            decoration: BoxDecoration(
                              color: const Color(0xFF6366F1).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.chat_bubble_outline_rounded,
                                color: Color(0xFF6366F1), size: 36),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            widget.partnerName.isEmpty
                                ? 'Start an Inquiry'
                                : 'Ask ${widget.partnerName}',
                            style: TextStyle(
                                color: textPrim,
                                fontSize: 17,
                                fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Send a message before booking — ask about availability, pricing, or anything you need to know.',
                            style: TextStyle(color: textMuted, fontSize: 13),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final msg   = messages[i];
                    final isMe  = msg.senderId == (currentUser?.id ?? '');
                    final showTime = i == 0 ||
                        messages[i]
                            .createdAt
                            .difference(messages[i - 1].createdAt)
                            .inMinutes
                            .abs() > 10;
                    return Column(
                      children: [
                        if (showTime)
                          _TimeDivider(time: msg.createdAt, textMuted: textMuted),
                        _InquiryBubble(
                          message:     msg,
                          isMe:        isMe,
                          partnerName: widget.partnerName,
                          cardColor:   cardColor,
                          textPrim:    textPrim,
                          textMuted:   textMuted,
                          isDark:      isDark,
                          onImageTap:  _showFullScreenImage,
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),

          // ── Image preview strip ───────────────────────────────────────────
          if (_pickedImageBytes != null)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              color: cardColor,
              child: Row(
                children: [
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.memory(_pickedImageBytes!,
                            width: 72, height: 72, fit: BoxFit.cover),
                      ),
                      Positioned(
                        top: 2, right: 2,
                        child: GestureDetector(
                          onTap: _clearImage,
                          child: Container(
                            width: 20, height: 20,
                            decoration: const BoxDecoration(
                                color: Colors.black87, shape: BoxShape.circle),
                            child: const Icon(Icons.close_rounded,
                                color: Colors.white, size: 13),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Image attached',
                            style: TextStyle(
                                color: textPrim,
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                        Text('Tap × to remove, send to share',
                            style: TextStyle(color: textMuted, fontSize: 11)),
                      ],
                    ),
                  ),
                  if (_uploading)
                    const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    ),
                ],
              ),
            ),

          // ── Input bar ──────────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(
                12, 10, 12, MediaQuery.of(context).padding.bottom + 10),
            decoration: BoxDecoration(
              color:  cardColor,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                GestureDetector(
                  onTap: (_sending || _uploading) ? null : _pickImage,
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.attach_file_rounded,
                      color: (_pickedImage != null)
                          ? const Color(0xFF6366F1)
                          : const Color(0xFF6366F1).withOpacity(0.6),
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color:        cardColor,
                      borderRadius: BorderRadius.circular(22),
                      border:       Border.all(color: borderColor),
                    ),
                    child: TextField(
                      controller: _msgCtrl,
                      maxLines:   null,
                      textCapitalization: TextCapitalization.sentences,
                      style: TextStyle(color: textPrim, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: _pickedImage != null
                            ? 'Add a caption (optional)…'
                            : widget.partnerName.isEmpty
                                ? 'Ask the partner something…'
                                : 'Ask ${widget.partnerName} something…',
                        hintStyle: TextStyle(color: textMuted, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: (_sending || _uploading) ? null : _send,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: (_sending || _uploading)
                          ? const Color(0xFF6366F1).withOpacity(0.4)
                          : const Color(0xFF6366F1),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6366F1).withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: (_sending || _uploading)
                        ? const Center(
                            child: SizedBox(
                              width: 20, height: 20,
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

// ── Inquiry message bubble ─────────────────────────────────────────────────────
class _InquiryBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe, isDark;
  final String partnerName;
  final Color cardColor, textPrim, textMuted;
  final void Function(String url) onImageTap;

  const _InquiryBubble({
    required this.message,
    required this.isMe,
    required this.isDark,
    required this.partnerName,
    required this.cardColor,
    required this.textPrim,
    required this.textMuted,
    required this.onImageTap,
  });

  @override
  Widget build(BuildContext context) {
    const indigoColor = Color(0xFF6366F1);
    final bubbleBg  = isMe ? indigoColor : cardColor;
    final textColor = isMe ? Colors.white : textPrim;
    final timeColor = isMe ? Colors.white.withOpacity(0.65) : textMuted;
    final hasImage  = message.imageUrl != null && message.imageUrl!.isNotEmpty;
    final hasText   = message.content.trim().isNotEmpty;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
            top: 4, bottom: 4,
            left: isMe ? 56 : 0,
            right: isMe ? 0 : 56),
        decoration: BoxDecoration(
          color: hasImage && !hasText ? Colors.transparent : bubbleBg,
          borderRadius: BorderRadius.only(
            topLeft:     Radius.circular(isMe ? 18 : 4),
            topRight:    Radius.circular(isMe ? 4 : 18),
            bottomLeft:  const Radius.circular(18),
            bottomRight: const Radius.circular(18),
          ),
          boxShadow: hasImage && !hasText
              ? []
              : [
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
            if (!isMe && partnerName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8, left: 14, right: 14),
                child: Text(partnerName,
                    style: const TextStyle(
                        fontSize: 11,
                        color: indigoColor,
                        fontWeight: FontWeight.w600)),
              ),
            if (hasImage)
              GestureDetector(
                onTap: () => onImageTap(message.imageUrl!),
                child: ClipRRect(
                  borderRadius: BorderRadius.only(
                    topLeft:     Radius.circular(isMe ? 18 : 4),
                    topRight:    Radius.circular(isMe ? 4 : 18),
                    bottomLeft:  Radius.circular(hasText ? 0 : 18),
                    bottomRight: Radius.circular(hasText ? 0 : 18),
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                        maxWidth: 260, minWidth: 120, maxHeight: 340),
                    child: Image.network(
                      message.imageUrl!,
                      fit: BoxFit.contain,
                      loadingBuilder: (_, child, p) {
                        if (p == null) return child;
                        return Container(
                          width: 220, height: 165,
                          alignment: Alignment.center,
                          child: const CircularProgressIndicator(
                              strokeWidth: 2, color: indigoColor),
                        );
                      },
                      errorBuilder: (_, __, ___) => Container(
                        width: 220, height: 80,
                        alignment: Alignment.center,
                        child: const Icon(Icons.broken_image_rounded,
                            size: 32, color: indigoColor),
                      ),
                    ),
                  ),
                ),
              ),
            if (hasText)
              Padding(
                padding: EdgeInsets.fromLTRB(14, hasImage ? 6 : 10, 14, 4),
                child: Text(message.content,
                    style: TextStyle(
                        fontSize: 14, color: textColor, height: 1.4)),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 2, 14, 8),
              child: Text(
                DateFormat('h:mm a').format(message.createdAt.toLocal()),
                style: TextStyle(fontSize: 10, color: timeColor),
              ),
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
      label = 'Today • ${DateFormat('h:mm a').format(time)}';
    } else if (today.difference(d).inDays == 1) {
      label = 'Yesterday • ${DateFormat('h:mm a').format(time)}';
    } else {
      label = DateFormat('MMM d • h:mm a').format(time);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        Expanded(child: Divider(color: textMuted.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(label,
              style: TextStyle(color: textMuted, fontSize: 11)),
        ),
        Expanded(child: Divider(color: textMuted.withOpacity(0.3))),
      ]),
    );
  }
}

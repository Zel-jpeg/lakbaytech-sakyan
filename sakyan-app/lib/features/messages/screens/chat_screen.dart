import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/supabase_service.dart';
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
  bool  _sending   = false;
  bool  _uploading = false;

  // Image attachment state
  XFile?     _pickedImage;
  Uint8List? _pickedImageBytes;

  String? _resolvedReceiverId;
  String? _resolvedReceiverName;

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
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut);
      } else {
        _scrollCtrl.jumpTo(max);
      }
    });
  }

  // ── Pick image from gallery ────────────────────────────────────────────────
  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source:       ImageSource.gallery,
        maxWidth:     1280,
        maxHeight:    1280,
        imageQuality: 82,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (mounted) {
        setState(() {
          _pickedImage      = picked;
          _pickedImageBytes = bytes;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not pick image: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _clearImage() {
    setState(() {
      _pickedImage      = null;
      _pickedImageBytes = null;
    });
  }

  // ── Upload picked image to Supabase and return public URL ─────────────────
  Future<String?> _uploadImage() async {
    if (_pickedImage == null || _pickedImageBytes == null) return null;
    setState(() => _uploading = true);
    try {
      final ext     = _pickedImage!.name.split('.').last.toLowerCase();
      final safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(ext)
          ? ext
          : 'jpg';
      final fileName =
          '${DateTime.now().millisecondsSinceEpoch}-${widget.bookingId.substring(0, 8)}.$safeExt';
      final url = await SupabaseService.uploadFile(
        bucket:      AppConstants.bucketChatImages,
        fileName:    fileName,
        fileBytes:   _pickedImageBytes!,
        contentType: 'image/$safeExt',
      );
      return url;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Image upload failed: ${e.toString()}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return null;
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  // ── Send message (with optional image) ────────────────────────────────────
  Future<void> _send() async {
    final text       = _msgCtrl.text.trim();
    final hasImage   = _pickedImage != null;
    final hasContent = text.isNotEmpty || hasImage;

    if (!hasContent || _sending || _uploading) return;

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
    final savedText = text;
    _msgCtrl.clear();

    // Upload image first if one is attached
    String? imageUrl;
    if (hasImage) {
      imageUrl = await _uploadImage();
      // If upload failed and there's no text either, abort and restore
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
      await ref.read(chatProvider(widget.bookingId).notifier).send(
            receiverId: _receiverId!,
            content:    savedText,
            imageUrl:   imageUrl,
          );
      _scrollToBottom(animated: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Failed to send: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _msgCtrl.text = savedText; // restore unsent text
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  // ── Fullscreen image viewer ────────────────────────────────────────────────
  void _showFullScreenImage(BuildContext ctx, String url) {
    showDialog(
      context: ctx,
      barrierColor: Colors.black87,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(0),
        child: Stack(
          fit: StackFit.expand,
          children: [
            InteractiveViewer(
              panEnabled: true,
              minScale:   0.5,
              maxScale:   5.0,
              child: Center(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  loadingBuilder: (_, child, progress) => progress == null
                      ? child
                      : const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary)),
                  errorBuilder: (_, __, ___) => const Icon(
                      Icons.broken_image_rounded,
                      color: Colors.white54,
                      size: 64),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: GestureDetector(
                onTap: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color:  Colors.black54,
                    shape:  BoxShape.circle,
                    border: Border.all(color: Colors.white30),
                  ),
                  child: const Icon(Icons.close_rounded,
                      color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Safe back navigation ───────────────────────────────────────────────────
  //
  // FIX: Pressing the system back button or the in-app back button while
  // the chat was pushed via context.push() from confirmation_screen caused
  // a crash because GoRouter had no previous route to pop to (the
  // confirmation screen itself was navigated away from with context.go()).
  //
  // Solution: use context.canPop() first. If we can pop safely, do it.
  // Otherwise fall back to the bookings list which is always in the shell.
  //
  void _handleBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/bookings');
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

    messagesAsync.whenData(
      (messages) => _tryResolveReceiver(messages, currentUser?.id),
    );

    // ── PopScope: intercepts the system back gesture / button ─────────────
    // Without this, pressing system back when there's nowhere to pop
    // exits the app entirely instead of going to the bookings list.
    return PopScope(
      canPop: false, // we handle it ourselves
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(
          // ── Explicit back button ───────────────────────────────────────
          // FIX: AppBar had no leading widget so there was no visible back
          // button. Added one that uses _handleBack() for safe navigation.
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: _handleBack,
          ),
          titleSpacing: 0,
          title: Row(
            children: [
              Container(
                width: 36, height: 36,
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
                            width: 80, height: 80,
                            decoration: const BoxDecoration(
                              color: AppColors.primaryGlow,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                                Icons.chat_bubble_outline_rounded,
                                color: AppColors.primary,
                                size: 38),
                          ),
                          const SizedBox(height: 16),
                          Text('No messages yet',
                              style: TextStyle(
                                  color: textMuted,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text('Send a message to get started!',
                              style:
                                  TextStyle(color: textMuted, fontSize: 13)),
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
                            onImageTap: (url) =>
                                _showFullScreenImage(context, url),
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
            ),

            // ── Image preview strip ──────────────────────────────────────────
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
                          child: Image.memory(
                            _pickedImageBytes!,
                            width: 72, height: 72,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 2, right: 2,
                          child: GestureDetector(
                            onTap: _clearImage,
                            child: Container(
                              width: 20, height: 20,
                              decoration: const BoxDecoration(
                                color: Colors.black87,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close_rounded,
                                  color: Colors.white, size: 13),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Image attached',
                            style: TextStyle(
                                color: textPrim,
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text('Tap send to share',
                            style: TextStyle(color: textMuted, fontSize: 11)),
                      ],
                    ),
                    if (_uploading) ...[
                      const Spacer(),
                      const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppColors.primary),
                      ),
                    ],
                  ],
                ),
              ),

            // ── Input bar ────────────────────────────────────────────────────
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
                  // Attachment button
                  GestureDetector(
                    onTap: (_sending || _uploading) ? null : _pickImage,
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.attach_file_rounded,
                        color: (_pickedImage != null)
                            ? AppColors.primary
                            : AppColors.primary.withOpacity(0.6),
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Text input
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
                        maxLines:   null,
                        textCapitalization: TextCapitalization.sentences,
                        style: TextStyle(color: textPrim, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: _hasValidReceiver
                              ? (_pickedImage != null
                                  ? 'Add a caption (optional)…'
                                  : 'Type a message…')
                              : 'Resolve recipient first…',
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
                  const SizedBox(width: 8),

                  // Send button
                  GestureDetector(
                    onTap: (_sending || _uploading) ? null : _send,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: (_sending || _uploading || !_hasValidReceiver)
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
      ),
    );
  }
}

// ── Message bubble ─────────────────────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe, isDark;
  final Color cardColor, textPrim, textMuted;
  final void Function(String url) onImageTap;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.isDark,
    required this.cardColor,
    required this.textPrim,
    required this.textMuted,
    required this.onImageTap,
  });

  @override
  Widget build(BuildContext context) {
    final bubbleBg  = isMe ? AppColors.primary : cardColor;
    final textColor = isMe ? Colors.white : textPrim;
    final timeColor = isMe ? Colors.white.withOpacity(0.65) : textMuted;
    final hasImage  = message.imageUrl != null && message.imageUrl!.isNotEmpty;
    final hasText   = message.content.isNotEmpty;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4, bottom: 4,
          left:  isMe ? 56 : 0,
          right: isMe ? 0  : 56,
        ),
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
            // Sender name (for others only)
            if (!isMe && message.senderName.isNotEmpty && !hasImage)
              Padding(
                padding: const EdgeInsets.only(top: 8, left: 14, right: 14),
                child: Text(
                  message.senderName,
                  style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600),
                ),
              ),

            // Image attachment
            if (hasImage)
              GestureDetector(
                onTap: () => onImageTap(message.imageUrl!),
                child: Hero(
                  tag: message.imageUrl!,
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                      topLeft:     Radius.circular(isMe ? 18 : 4),
                      topRight:    Radius.circular(isMe ? 4 : 18),
                      bottomLeft:  Radius.circular(hasText ? 0 : 18),
                      bottomRight: Radius.circular(hasText ? 0 : 18),
                    ),
                    child: Image.network(
                      message.imageUrl!,
                      width: 220, height: 165,
                      fit: BoxFit.cover,
                      loadingBuilder: (ctx, child, progress) {
                        if (progress == null) return child;
                        return Container(
                          width: 220, height: 165,
                          color: AppColors.bgElevated,
                          child: const Center(
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary),
                          ),
                        );
                      },
                      errorBuilder: (_, __, ___) => Container(
                        width: 220, height: 80,
                        color: AppColors.bgElevated,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.broken_image_rounded,
                                color: AppColors.textMuted, size: 28),
                            const SizedBox(height: 4),
                            Text('Image unavailable',
                                style: TextStyle(
                                    color: textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // Text content
            if (hasText)
              Padding(
                padding: EdgeInsets.only(
                  top: hasImage
                      ? 6
                      : ((!isMe && message.senderName.isNotEmpty) ? 4 : 10),
                  bottom: 4,
                  left:   14,
                  right:  14,
                ),
                child: Text(
                  message.content,
                  style: TextStyle(
                      color: textColor, fontSize: 14, height: 1.4),
                ),
              ),

            // Timestamp row
            Padding(
              padding: const EdgeInsets.only(
                  bottom: 8, left: 14, right: 14, top: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormat('h:mm a').format(message.createdAt),
                    style: TextStyle(
                        fontSize: 10,
                        color: hasImage && !hasText ? textMuted : timeColor),
                  ),
                  if (isMe) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.isRead
                          ? Icons.done_all_rounded
                          : Icons.done_rounded,
                      size: 13,
                      color: hasImage && !hasText ? textMuted : timeColor,
                    ),
                  ],
                ],
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
      label = 'Today  ${DateFormat('h:mm a').format(time)}';
    } else if (today.difference(d).inDays == 1) {
      label = 'Yesterday  ${DateFormat('h:mm a').format(time)}';
    } else {
      label = DateFormat('MMM d,  h:mm a').format(time);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(children: [
        Expanded(child: Divider(color: textMuted.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(label,
              style: TextStyle(fontSize: 11, color: textMuted)),
        ),
        Expanded(child: Divider(color: textMuted.withOpacity(0.3))),
      ]),
    );
  }
}
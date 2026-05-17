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

String _capFull(String? s) {
  if (s == null || s.trim().isEmpty) return '';
  return s.trim().split(' ').map((w) {
    if (w.isEmpty) return w;
    return w[0].toUpperCase() + w.substring(1);
  }).join(' ');
}

/// Pre-booking inquiry chat screen.
/// Allows a customer to message a partner using only the [carId] —
/// no existing booking required.
class InquiryChatScreen extends ConsumerStatefulWidget {
  final String carId;
  final String partnerUserId;
  final String partnerName;
  final String carName;

  const InquiryChatScreen({
    super.key,
    required this.carId,
    required this.partnerUserId,
    required this.partnerName,
    required this.carName,
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

  @override
  void initState() {
    super.initState();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref
            .read(inquiryChatProvider(widget.partnerUserId).notifier)
            .silentRefresh(widget.partnerUserId);
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
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      } else {
        _scrollCtrl.jumpTo(max);
      }
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (mounted) setState(() { _pickedImage = picked; _pickedImageBytes = bytes; });
  }

  void _clearImage() => setState(() { _pickedImage = null; _pickedImageBytes = null; });

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
    final text     = _msgCtrl.text.trim();
    final hasImage = _pickedImage != null;
    if ((!text.isNotEmpty && !hasImage) || _sending || _uploading) return;

    setState(() => _sending = true);
    final savedText = text;
    _msgCtrl.clear();

    String? imageUrl;
    if (hasImage) {
      imageUrl = await _uploadImage();
      if (imageUrl == null && savedText.isEmpty) {
        if (mounted) { _msgCtrl.text = savedText; setState(() => _sending = false); }
        return;
      }
      _clearImage();
    }

    try {
      await ref.read(inquiryChatProvider(widget.partnerUserId).notifier).send(
            carId:    widget.carId,
            content:  savedText,
            imageUrl: imageUrl,
          );
      _scrollToBottom(animated: true);
    } catch (e) {
      if (mounted) {
        _showError('Failed to send: ${e.toString().replaceFirst('Exception: ', '')}');
        _msgCtrl.text = savedText;
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(inquiryChatProvider(widget.partnerUserId));
    final currentUser   = ref.watch(currentUserProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    final displayName = _capFull(widget.partnerName.isNotEmpty
        ? widget.partnerName
        : 'Partner');
    final avatarLetter = displayName[0].toUpperCase();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go('/cars'),
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
                child: Text(avatarLetter,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(displayName,
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: textPrim)),
                Text(widget.carName,
                    style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Info banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppColors.primary.withOpacity(0.08),
            child: Row(children: [
              const Icon(Icons.info_outline_rounded,
                  color: AppColors.primary, size: 14),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pre-booking inquiry for ${widget.carName}. '
                  'You can ask the partner any questions before booking.',
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500),
                ),
              ),
            ]),
          ),

          // Messages
          Expanded(
            child: messagesAsync.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary)),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
                    const SizedBox(height: 12),
                    Text('Failed to load messages',
                        style: TextStyle(color: textMuted)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(
                          inquiryChatProvider(widget.partnerUserId)),
                      child: const Text('Retry'),
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
                          width: 72, height: 72,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryGlow,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.chat_bubble_outline_rounded,
                              color: AppColors.primary, size: 34),
                        ),
                        const SizedBox(height: 16),
                        Text('Start the conversation!',
                            style: TextStyle(
                                color: textMuted,
                                fontSize: 15,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('Ask ${displayName} about this car.',
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
                          _TimeDivider(time: msg.createdAt, textMuted: textMuted),
                        _InquiryBubble(
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

          // Image preview
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
                    child: Text('Image attached',
                        style: TextStyle(
                            color: textPrim,
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),

          // Input bar
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
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.attach_file_rounded,
                        color: AppColors.primary.withOpacity(0.6), size: 20),
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
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      style: TextStyle(color: textPrim, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Ask ${displayName} a question…',
                        hintStyle: TextStyle(color: textMuted, fontSize: 14),
                        border:        InputBorder.none,
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
                          ? AppColors.primary.withOpacity(0.4)
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(label,
          style: TextStyle(
              color: textMuted, fontSize: 10, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center),
    );
  }
}

// ── Message bubble ────────────────────────────────────────────────────────────
class _InquiryBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe, isDark;
  final Color cardColor, textPrim, textMuted;

  const _InquiryBubble({
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
    final timeColor = isMe ? Colors.white.withOpacity(0.6) : textMuted;
    final hasText   = message.content.trim().isNotEmpty;
    final hasImage  = message.imageUrl != null && message.imageUrl!.isNotEmpty;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
            top: 4, bottom: 4, left: isMe ? 56 : 0, right: isMe ? 0 : 56),
        decoration: BoxDecoration(
          color: hasImage && !hasText ? Colors.transparent : bubbleBg,
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
            if (hasImage)
              ClipRRect(
                borderRadius: BorderRadius.only(
                  topLeft:     Radius.circular(isMe ? 18 : 4),
                  topRight:    Radius.circular(isMe ? 4 : 18),
                  bottomLeft:  Radius.circular(hasText ? 0 : 18),
                  bottomRight: Radius.circular(hasText ? 0 : 18),
                ),
                child: Image.network(message.imageUrl!,
                    width: 220, fit: BoxFit.cover),
              ),
            if (hasText)
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
                child: Text(message.content,
                    style: TextStyle(color: textColor, fontSize: 14, height: 1.4)),
              ),
            Padding(
              padding: const EdgeInsets.only(left: 14, right: 14, bottom: 8),
              child: Text(
                DateFormat('h:mm a').format(message.createdAt.toLocal()),
                style: TextStyle(color: timeColor, fontSize: 10),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

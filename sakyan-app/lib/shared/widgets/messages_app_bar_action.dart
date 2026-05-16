import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../../features/messages/providers/message_provider.dart';

/// A reusable AppBar action that shows a chat icon with an unread-count
/// badge. Tapping navigates to /inbox and refreshes the provider so the
/// badge clears as conversations are read.
///
/// Usage: add `MessagesAppBarAction()` to any AppBar's `actions` list.
class MessagesAppBarAction extends ConsumerWidget {
  const MessagesAppBarAction({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadConversationsCountProvider);

    return Stack(
      alignment: Alignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chat_bubble_outline_rounded),
          tooltip: 'Messages',
          onPressed: () async {
            context.push(AppRoutes.inbox);
            // Refresh after a short delay so counts update when user returns
            await Future.delayed(const Duration(milliseconds: 500));
            ref.invalidate(conversationsProvider);
          },
        ),
        if (unread > 0)
          Positioned(
            top: 8,
            right: 8,
            child: IgnorePointer(
              child: AnimatedScale(
                scale: 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  width:  unread > 9 ? 18 : 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color:        AppColors.error,
                    shape:        unread > 9 ? BoxShape.rectangle : BoxShape.circle,
                    borderRadius: unread > 9 ? BorderRadius.circular(8) : null,
                    border:       Border.all(
                      color: Colors.transparent,
                      width: 1.5,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    unread > 99 ? '99+' : '$unread',
                    style: const TextStyle(
                      color:      Colors.white,
                      fontSize:   9,
                      fontWeight: FontWeight.w800,
                      height:     1,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

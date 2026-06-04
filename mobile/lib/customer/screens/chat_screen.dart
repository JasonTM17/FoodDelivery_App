import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/providers/tracking_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String orderId;

  const ChatScreen({super.key, required this.orderId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isSending = false;

  final List<String> _quickReplies = [
    'Đơn hàng của tôi đâu rồi?',
    'Bao lâu nữa tới?',
    'Cho tôi xin số điện thoại tài xế',
    'Tôi muốn hủy đơn',
    'Khác...',
  ];

  @override
  void initState() {
    super.initState();
    // Start tracking for chat messages on this order
    Future.microtask(() {
      ref.read(trackingProvider.notifier).startTracking(widget.orderId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty || _isSending) return;

    final trimmed = text.trim();
    setState(() => _isSending = true);

    try {
      ref.read(trackingProvider.notifier).sendChatMessage(trimmed);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể gửi tin nhắn. Vui lòng thử lại.')),
      );
    }

    _messageController.clear();
    setState(() => _isSending = false);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  List<_ChatMessage> _buildMessages(List<Map<String, dynamic>> rawMessages) {
    return rawMessages.map((raw) {
      final from = raw['from'] as String? ?? 'driver';
      final text = raw['message'] as String? ?? '';
      final timestamp = raw['timestamp'] as String?;
      final time = timestamp != null ? DateTime.tryParse(timestamp) : null;

      // isFromDriver = true means message is from the driver (shown on left)
      return _ChatMessage(
        text: text,
        isFromDriver: from == 'driver',
        time: time ?? DateTime.now(),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final trackingState = ref.watch(trackingProvider);
    final orderState = ref.watch(orderProvider);
    final driverName = orderState.currentTrackingOrder?.driverName ?? 'Tài xế';

    final messages = _buildMessages(trackingState.chatMessages);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primaryLight,
              child: const Icon(Icons.person, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(driverName, style: const TextStyle(fontSize: 15)),
                Text(
                  trackingState.isConnected ? 'Đang hoạt động' : 'Đang kết nối...',
                  style: TextStyle(
                    fontSize: 11,
                    color: trackingState.isConnected ? AppColors.success : AppColors.textHint,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // AI chat header
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primaryLight),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.auto_awesome, size: 18, color: Colors.white),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Hỗ trợ bởi AI - Trả lời nhanh các câu hỏi thường gặp',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.primaryDark),
                  ),
                ),
              ],
            ),
          ),

          // Messages area
          Expanded(
            child: _buildMessagesArea(messages, trackingState),
          ),

          // Quick replies
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _quickReplies.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(
                      _quickReplies[index],
                      style: const TextStyle(fontSize: 12),
                    ),
                    onPressed: () => _sendMessage(_quickReplies[index]),
                    backgroundColor: AppColors.surface,
                    side: const BorderSide(color: AppColors.border),
                  ),
                );
              },
            ),
          ),

          // Input area
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: BoxDecoration(
              color: AppColors.background,
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadow,
                  blurRadius: 4,
                  offset: const Offset(0, -1),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: 'Nhập tin nhắn...',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: _sendMessage,
                      enabled: !_isSending,
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _isSending ? null : () => _sendMessage(_messageController.text),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _isSending ? AppColors.textHint : AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: _isSending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesArea(List<_ChatMessage> messages, TrackingState trackingState) {
    // Loading state when no connection yet and no messages
    if (!trackingState.isConnected && messages.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 12),
            Text('Đang kết nối...', style: AppTextStyles.bodySmall),
          ],
        ),
      );
    }

    // Empty state when connected but no messages yet
    if (messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.chat_bubble_outline, size: 36, color: AppColors.textHint),
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có tin nhắn nào',
              style: AppTextStyles.headline4.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              'Gửi tin nhắn đầu tiên để bắt đầu trò chuyện',
              style: AppTextStyles.bodySmall,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        return _buildMessageBubble(messages[index]);
      },
    );
  }

  Widget _buildMessageBubble(_ChatMessage message) {
    // isFromDriver = true: driver message, shown on left
    // isFromDriver = false: customer message, shown on right
    final isFromDriver = message.isFromDriver;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isFromDriver ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (isFromDriver) ...[
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.support_agent, size: 16, color: AppColors.primary),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isFromDriver ? Colors.white : AppColors.primary,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isFromDriver ? 4 : 16),
                  bottomRight: Radius.circular(isFromDriver ? 16 : 4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadow,
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text,
                    style: TextStyle(
                      color: isFromDriver ? AppColors.textPrimary : Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.time),
                    style: TextStyle(
                      fontSize: 10,
                      color: isFromDriver ? AppColors.textHint : Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (!isFromDriver) const SizedBox(width: 4),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _ChatMessage {
  final String text;
  final bool isFromDriver;
  final DateTime time;

  const _ChatMessage({
    required this.text,
    required this.isFromDriver,
    required this.time,
  });
}

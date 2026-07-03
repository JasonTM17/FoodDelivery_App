import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/ai_chat_service.dart';

final aiChatProvider =
    StateNotifierProvider.family<AiChatNotifier, AiChatState, String>((
      ref,
      orderId,
    ) {
      return AiChatNotifier(orderId: orderId);
    });

class AiChatState {
  final List<AiChatMessage> messages;
  final bool isSending;
  final String? error;

  const AiChatState({
    this.messages = const [],
    this.isSending = false,
    this.error,
  });

  AiChatState copyWith({
    List<AiChatMessage>? messages,
    bool? isSending,
    String? error,
  }) {
    return AiChatState(
      messages: messages ?? this.messages,
      isSending: isSending ?? this.isSending,
      error: error,
    );
  }
}

class AiChatMessage {
  final String text;
  final bool isFromAssistant;
  final DateTime timestamp;
  final String? action;
  final bool grounded;

  const AiChatMessage({
    required this.text,
    required this.isFromAssistant,
    required this.timestamp,
    this.action,
    this.grounded = false,
  });

  factory AiChatMessage.user(String text) {
    return AiChatMessage(
      text: text,
      isFromAssistant: false,
      timestamp: DateTime.now(),
    );
  }

  factory AiChatMessage.assistant(AiChatReply reply) {
    return AiChatMessage(
      text: reply.reply,
      isFromAssistant: true,
      timestamp: DateTime.now(),
      action: reply.action,
      grounded: reply.grounded,
    );
  }
}

class AiChatNotifier extends StateNotifier<AiChatState> {
  final String orderId;
  final AiChatService _service;

  AiChatNotifier({required this.orderId, AiChatService? service})
    : _service = service ?? AiChatService(),
      super(const AiChatState());

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isSending) return;

    final userMessage = AiChatMessage.user(trimmed);
    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isSending: true,
      error: null,
    );

    try {
      final reply = await _service.createReply(
        AiChatRequest(
          message: trimmed,
          sessionId: _sessionId,
          orderId: _orderReference,
        ),
      );
      state = state.copyWith(
        messages: [...state.messages, AiChatMessage.assistant(reply)],
        isSending: false,
        error: null,
      );
    } catch (error) {
      state = state.copyWith(isSending: false, error: error.toString());
      rethrow;
    }
  }

  String get _sessionId {
    final value = orderId.trim();
    return value.isEmpty ? 'mobile-support' : 'mobile-$value';
  }

  String? get _orderReference {
    final value = orderId.trim();
    return looksLikeOrderReference(value) ? value : null;
  }
}

bool looksLikeOrderReference(String value) {
  return RegExp(r'^FD\d{10}$', caseSensitive: false).hasMatch(value) ||
      RegExp(r'^F[DF]-?\d{3,10}$', caseSensitive: false).hasMatch(value) ||
      RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        caseSensitive: false,
      ).hasMatch(value);
}

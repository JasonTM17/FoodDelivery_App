import '../../shared/api/api_client.dart';

class AiChatRequest {
  final String message;
  final String? sessionId;
  final String? orderId;

  const AiChatRequest({required this.message, this.sessionId, this.orderId});

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      if (sessionId != null && sessionId!.isNotEmpty) 'sessionId': sessionId,
      if (orderId != null && orderId!.isNotEmpty) 'orderId': orderId,
    };
  }
}

class AiChatReply {
  final String reply;
  final String sessionId;
  final String action;
  final bool grounded;

  const AiChatReply({
    required this.reply,
    required this.sessionId,
    required this.action,
    required this.grounded,
  });

  factory AiChatReply.fromJson(Map<String, dynamic> json) {
    final reply = json['reply'];
    final sessionId = json['sessionId'];
    final action = json['action'];
    if (reply is! String || reply.trim().isEmpty) {
      throw const FormatException('AI_CHAT_INVALID_REPLY');
    }
    if (sessionId is! String || !looksLikeUuid(sessionId.trim())) {
      throw const FormatException('AI_CHAT_INVALID_SESSION');
    }
    if (action is! String || (action != 'answered' && action != 'escalated')) {
      throw const FormatException('AI_CHAT_INVALID_ACTION');
    }

    return AiChatReply(
      reply: reply.trim(),
      sessionId: sessionId,
      action: action,
      grounded: json['grounded'] as bool? ?? false,
    );
  }
}

bool looksLikeUuid(String value) {
  return RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    caseSensitive: false,
  ).hasMatch(value);
}

class AiChatService {
  final ApiClient _api;

  AiChatService({ApiClient? api}) : _api = api ?? ApiClient.instance;

  Future<AiChatReply> createReply(AiChatRequest request) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/ai/chat',
      data: request.toJson(),
    );
    final data = response.data;
    if (data == null) {
      throw StateError('AI_CHAT_EMPTY_RESPONSE');
    }
    return AiChatReply.fromJson(data);
  }
}

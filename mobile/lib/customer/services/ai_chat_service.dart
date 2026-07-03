import '../../shared/api/api_client.dart';

class AiChatRequest {
  final String message;
  final String sessionId;
  final String? orderId;

  const AiChatRequest({
    required this.message,
    required this.sessionId,
    this.orderId,
  });

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'sessionId': sessionId,
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
    return AiChatReply(
      reply: json['reply'] as String? ?? '',
      sessionId: json['sessionId'] as String? ?? '',
      action: json['action'] as String? ?? 'degraded',
      grounded: json['grounded'] as bool? ?? false,
    );
  }
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

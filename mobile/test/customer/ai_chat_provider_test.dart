import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/ai_chat_provider.dart';
import 'package:foodflow_customer/customer/services/ai_chat_service.dart';

void main() {
  group('AiChatRequest', () {
    test('omits orderId when support chat has no real order reference', () {
      const request = AiChatRequest(
        message: 'Need help choosing food',
        sessionId: 'mobile-support',
      );

      expect(request.toJson(), {
        'message': 'Need help choosing food',
        'sessionId': 'mobile-support',
      });
    });

    test('keeps orderId for grounded order-specific chat', () {
      const request = AiChatRequest(
        message: 'Where is my order?',
        sessionId: 'mobile-FD0000000001',
        orderId: 'FD0000000001',
      );

      expect(request.toJson(), {
        'message': 'Where is my order?',
        'sessionId': 'mobile-FD0000000001',
        'orderId': 'FD0000000001',
      });
    });
  });

  group('looksLikeOrderReference', () {
    test('accepts FoodFlow order codes and UUIDs', () {
      expect(looksLikeOrderReference('FD0000000001'), isTrue);
      expect(looksLikeOrderReference('FF-123456'), isTrue);
      expect(
        looksLikeOrderReference('4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10'),
        isTrue,
      );
    });

    test('rejects support aliases and arbitrary text', () {
      expect(looksLikeOrderReference('support'), isFalse);
      expect(looksLikeOrderReference('Need recommendations'), isFalse);
    });
  });

  group('AiChatReply', () {
    test('parses degraded replies without inventing grounding', () {
      final reply = AiChatReply.fromJson({
        'reply': 'AI service unavailable',
        'sessionId': 'mobile-support',
        'action': 'degraded',
      });

      expect(reply.reply, 'AI service unavailable');
      expect(reply.action, 'degraded');
      expect(reply.grounded, isFalse);
    });
  });
}

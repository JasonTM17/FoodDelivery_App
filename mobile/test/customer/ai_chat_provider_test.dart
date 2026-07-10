import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/ai_chat_provider.dart';
import 'package:foodflow_customer/customer/services/ai_chat_service.dart';

void main() {
  group('AiChatRequest', () {
    test('omits orderId when support chat has no real order reference', () {
      const request = AiChatRequest(message: 'Need help choosing food');

      expect(request.toJson(), {'message': 'Need help choosing food'});
    });

    test(
      'keeps a validated order reference and server-issued session UUID',
      () {
        const request = AiChatRequest(
          message: 'Where is my order?',
          sessionId: '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
          orderId: 'FD0000000001',
        );

        expect(request.toJson(), {
          'message': 'Where is my order?',
          'sessionId': '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
          'orderId': 'FD0000000001',
        });
      },
    );
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
    test('parses live provider replies without inventing a default action', () {
      final reply = AiChatReply.fromJson({
        'reply': 'Your order is being prepared.',
        'sessionId': '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
        'action': 'answered',
      });

      expect(reply.reply, 'Your order is being prepared.');
      expect(reply.action, 'answered');
      expect(reply.grounded, isFalse);
    });

    test(
      'rejects deprecated or malformed actions instead of creating a fallback reply',
      () {
        expect(
          () => AiChatReply.fromJson({
            'reply': 'AI service unavailable',
            'sessionId': '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
            'action': 'degraded',
          }),
          throwsFormatException,
        );
        expect(
          () => AiChatReply.fromJson({
            'sessionId': '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
            'action': 'answered',
          }),
          throwsFormatException,
        );
      },
    );

    test('rejects a non-UUID session returned by the API', () {
      expect(
        () => AiChatReply.fromJson({
          'reply': 'Live reply',
          'sessionId': 'mobile-support',
          'action': 'answered',
        }),
        throwsFormatException,
      );
    });
  });

  test(
    'AiChatNotifier reuses only the session UUID returned by the server',
    () async {
      final service = _FakeAiChatService();
      final notifier = AiChatNotifier(
        orderId: 'FD0000000001',
        service: service,
      );

      await notifier.sendMessage('Where is my order?');
      await notifier.sendMessage('Any update?');

      expect(service.requests, hasLength(2));
      expect(service.requests.first.sessionId, isNull);
      expect(service.requests.first.orderId, 'FD0000000001');
      expect(
        service.requests.last.sessionId,
        '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
      );
    },
  );
}

class _FakeAiChatService extends AiChatService {
  final List<AiChatRequest> requests = [];

  @override
  Future<AiChatReply> createReply(AiChatRequest request) async {
    requests.add(request);
    return const AiChatReply(
      reply: 'Live reply',
      sessionId: '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10',
      action: 'answered',
      grounded: true,
    );
  }
}

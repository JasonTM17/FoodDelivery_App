import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  group('ApiClient.generateIdempotencyKey', () {
    test('generates backend-compatible UUID v4 keys', () {
      final key = ApiClient.generateIdempotencyKey();

      expect(
        key,
        matches(
          RegExp(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
          ),
        ),
      );
    });

    test('generates unique keys across calls', () {
      final keys = List.generate(50, (_) => ApiClient.generateIdempotencyKey());

      expect(keys.toSet(), hasLength(keys.length));
    });
  });

  group('redactHttpLogValue', () {
    test('redacts credentials, tokens, and PII recursively', () {
      final redacted = redactHttpLogValue({
        'email': 'customer@example.com',
        'password': 'secret-pass',
        'refreshToken': 'refresh-secret',
        'deliveryAddress': {
          'addressLine': '123 Secret Street',
          'phone': '0900000000',
          'note': 'leave at door',
        },
        'items': [
          {'name': 'Pho', 'paymentMethod': 'wallet'},
        ],
      });

      expect(redacted, {
        'email': 'customer@example.com',
        'password': '[REDACTED]',
        'refreshToken': '[REDACTED]',
        'deliveryAddress': '[REDACTED]',
        'items': [
          {'name': 'Pho', 'paymentMethod': '[REDACTED]'},
        ],
      });
    });
  });
}

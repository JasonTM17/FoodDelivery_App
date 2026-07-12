import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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
        'email': '[REDACTED]',
        'password': '[REDACTED]',
        'refreshToken': '[REDACTED]',
        'deliveryAddress': '[REDACTED]',
        'items': [
          {'name': '[REDACTED]', 'paymentMethod': '[REDACTED]'},
        ],
      });
    });

    test('redacts precise GPS coordinates at every payload depth', () {
      final redacted = redactHttpLogValue({
        'lat': 10.7769,
        'lng': 106.7009,
        'driverLatitude': 10.7770,
        'driverLongitude': 106.7010,
        'location': {'latitude': 10.7771, 'longitude': 106.7011},
        'platform': 'android',
      });

      expect(redacted, {
        'lat': '[REDACTED]',
        'lng': '[REDACTED]',
        'driverLatitude': '[REDACTED]',
        'driverLongitude': '[REDACTED]',
        'location': '[REDACTED]',
        'platform': 'android',
      });
    });
  });

  group('single-flight 401 refresh (B-MOB-03)', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    late _RefreshInterceptor adapter;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({
        'auth_token': 'expired-token',
        'refresh_token': 'valid-refresh',
      });
      adapter = _RefreshInterceptor();
      ApiClient.instance.dio.httpClientAdapter = adapter;
      ApiClient.instance.dio.options.baseUrl = 'http://test.local';
    });

    test('parallel 401s trigger only one refresh call', () async {
      final client = ApiClient.instance;

      final results = await Future.wait([
        client.get('/protected/a'),
        client.get('/protected/b'),
        client.get('/protected/c'),
      ]);

      expect(adapter.refreshCalls, 1);
      expect(results.every((r) => r.statusCode == 200), isTrue);
      expect(adapter.protectedHitsWithNewToken, 3);
    });
  });
}

/// Minimal adapter: first hit per protected path returns 401, refresh returns tokens,
/// retried protected calls return 200.
class _RefreshInterceptor implements HttpClientAdapter {
  int refreshCalls = 0;
  int protectedHitsWithNewToken = 0;
  final _seen = <String>{};

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final path = options.path;
    final auth = options.headers['Authorization']?.toString() ?? '';

    if (path.contains('/auth/refresh')) {
      refreshCalls++;
      // Simulate slight latency so parallel 401s queue on the same Completer.
      await Future<void>.delayed(const Duration(milliseconds: 30));
      return ResponseBody.fromString(
        '{"accessToken":"new-access","refreshToken":"new-refresh"}',
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }

    if (path.startsWith('/protected')) {
      if (auth.contains('new-access')) {
        protectedHitsWithNewToken++;
        return ResponseBody.fromString(
          '{"data":{"ok":true}}',
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      }
      // First attempt with expired token → 401
      if (!_seen.contains(path) || !auth.contains('new-access')) {
        _seen.add(path);
        return ResponseBody.fromString(
          '{"message":"Unauthorized"}',
          401,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      }
    }

    return ResponseBody.fromString(
      '{"message":"not found"}',
      404,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }
}

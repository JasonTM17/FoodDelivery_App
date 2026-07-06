import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/loyalty_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _LoyaltyApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _LoyaltyApiInterceptor();
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  test('fetchLoyalty accepts the backend loyalty snapshot contract', () async {
    final notifier = LoyaltyNotifier();

    await notifier.fetchLoyalty();

    expect(notifier.state.error, isNull);
    expect(notifier.state.isLoading, isFalse);
    expect(notifier.state.totalPoints, 320);
    expect(notifier.state.tier, 'silver');
    expect(notifier.state.pointsToNextTier, 180);
    expect(notifier.state.transactions, hasLength(2));
    expect(notifier.state.transactions.first.isCredit, isTrue);
    expect(notifier.state.transactions.last.isCredit, isFalse);
    expect(notifier.state.transactions.first.description, 'Completed order');
  });

  test(
    'fetchLoyalty rejects missing snapshot fields instead of faking defaults',
    () async {
      apiInterceptor.payload = _loyaltyPayload()..remove('tier');
      final notifier = LoyaltyNotifier();

      await notifier.fetchLoyalty();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, 'LOYALTY_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.transactions, isEmpty);
    },
  );

  test('fetchLoyalty rejects incomplete transaction rows', () async {
    apiInterceptor.payload = _loyaltyPayload()
      ..['transactions'] = [
        {
          'id': 'tx-bad',
          'points': 25,
          'description': 'Missing type',
          'createdAt': '2026-07-05T10:00:00.000Z',
        },
      ];
    final notifier = LoyaltyNotifier();

    await notifier.fetchLoyalty();

    expect(notifier.state.isLoading, isFalse);
    expect(notifier.state.error, 'LOYALTY_CONTRACT_INVALID_RESPONSE');
  });
}

class _LoyaltyApiInterceptor extends Interceptor {
  Map<String, dynamic> payload = _loyaltyPayload();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/users/loyalty' && options.method == 'GET') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: payload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _loyaltyPayload() => {
  'totalPoints': 320,
  'tier': 'silver',
  'pointsToNextTier': 180,
  'transactions': [
    {
      'id': 'tx-credit',
      'points': 50,
      'type': 'credit',
      'description': 'Completed order',
      'createdAt': '2026-07-05T10:00:00.000Z',
    },
    {
      'id': 'tx-debit',
      'points': 25,
      'type': 'debit',
      'description': 'Voucher redemption',
      'createdAt': '2026-07-05T11:00:00.000Z',
    },
  ],
};

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/referral_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ReferralNotifier.fetchReferral', () {
    late _ReferralApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _ReferralApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test('accepts the backend referral snapshot contract', () async {
      final notifier = ReferralNotifier();

      await notifier.fetchReferral();

      expect(notifier.state.error, isNull);
      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.referralCode, 'ABCD1234');
      expect(notifier.state.inviteCount, 3);
      expect(notifier.state.bonusPoints, 150);
    });

    test('accepts explicit zero stats from the backend', () async {
      apiInterceptor.payload = {
        'code': 'NEWCODE1',
        'inviteesCount': 0,
        'rewardsEarned': 0,
      };
      final notifier = ReferralNotifier();

      await notifier.fetchReferral();

      expect(notifier.state.error, isNull);
      expect(notifier.state.referralCode, 'NEWCODE1');
      expect(notifier.state.inviteCount, 0);
      expect(notifier.state.bonusPoints, 0);
    });

    test('rejects missing stats instead of faking zeros', () async {
      apiInterceptor.payload = _referralPayload()..remove('inviteesCount');
      final notifier = ReferralNotifier();

      await notifier.fetchReferral();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, 'REFERRAL_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.referralCode, isNull);
    });

    test(
      'rejects legacy mobile field names that are not the backend contract',
      () async {
        apiInterceptor.payload = {
          'code': 'ABCD1234',
          'inviteCount': 3,
          'bonusPoints': 150,
        };
        final notifier = ReferralNotifier();

        await notifier.fetchReferral();

        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.error, 'REFERRAL_CONTRACT_INVALID_RESPONSE');
      },
    );
  });
}

class _ReferralApiInterceptor extends Interceptor {
  Map<String, dynamic> payload = _referralPayload();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/users/referral' && options.method == 'GET') {
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

Map<String, dynamic> _referralPayload() => {
  'code': 'ABCD1234',
  'inviteesCount': 3,
  'rewardsEarned': 150,
};

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/tip_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _TipApiInterceptor interceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    interceptor = _TipApiInterceptor();
    ApiClient.instance.dio.interceptors.add(interceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(interceptor);
  });

  test(
    'TipState effectiveAmount prefers custom amount over suggested amount',
    () {
      const state = TipState(suggestedAmount: 10000, customAmount: 15000);

      expect(state.effectiveAmount, 15000);
    },
  );

  test('TipState copyWith can clear the opposite amount source', () {
    const state = TipState(suggestedAmount: 10000);

    final updated = state.copyWith(
      customAmount: 25000,
      clearSuggestedAmount: true,
    );

    expect(updated.suggestedAmount, isNull);
    expect(updated.customAmount, 25000);
    expect(updated.effectiveAmount, 25000);
  });

  test('clearing a custom field removes the stale effective amount', () {
    final notifier = TipNotifier();
    notifier.setCustomAmount(25000);

    notifier.clearCustomAmount();

    expect(notifier.state.customAmount, isNull);
    expect(notifier.effectiveAmount, 0);
  });

  test(
    'submitTip exposes a stable error code instead of provider details',
    () async {
      interceptor.shouldFail = true;
      final notifier = TipNotifier()..selectAmount(10000);

      final saved = await notifier.submitTip('trip-1');

      expect(saved, isFalse);
      expect(notifier.state.error, 'DRIVER_TIP_SUBMIT_FAILED');
      expect(
        notifier.state.error,
        isNot(contains('sensitive-provider-detail')),
      );
    },
  );
}

class _TipApiInterceptor extends Interceptor {
  bool shouldFail = false;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path != '/driver/trips/trip-1/tip-report') {
      handler.next(options);
      return;
    }
    if (shouldFail) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: 'sensitive-provider-detail',
          response: Response<dynamic>(
            requestOptions: options,
            statusCode: 503,
            data: {'detail': 'sensitive-provider-detail'},
          ),
        ),
      );
      return;
    }
    handler.resolve(
      Response<dynamic>(requestOptions: options, statusCode: 201, data: {}),
    );
  }
}

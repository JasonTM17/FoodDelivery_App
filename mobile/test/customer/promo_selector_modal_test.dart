import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/widgets/promo_selector_modal.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _PromotionsApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _PromotionsApiInterceptor();
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  testWidgets(
    'renders fixed promotions by title instead of fake zero percent',
    (tester) async {
      apiInterceptor.payload = [_fixedPromotionPayload()];

      await tester.pumpWidget(_wrap(const PromoSelectorModal()));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Giảm 10.000đ'), findsOneWidget);
      expect(find.text('Giảm 0%'), findsNothing);
    },
  );

  testWidgets('shows contract error when promotions response is not a list', (
    tester,
  ) async {
    apiInterceptor.payload = {'promotions': []};

    await tester.pumpWidget(_wrap(const PromoSelectorModal()));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('PROMOTIONS_CONTRACT_INVALID_RESPONSE'), findsOneWidget);
  });
}

Widget _wrap(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      locale: const Locale('vi'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(body: child),
    ),
  );
}

class _PromotionsApiInterceptor extends Interceptor {
  dynamic payload = [_fixedPromotionPayload()];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/promotions/available' && options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
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

Map<String, dynamic> _fixedPromotionPayload() => {
  'id': 'promotion-fixed',
  'code': 'FIXED10',
  'title': 'Giảm 10.000đ',
  'name': 'Giảm 10.000đ',
  'description': 'Áp dụng cho đơn tối thiểu 50.000đ',
  'type': 'fixed',
  'value': 10000,
  'discountPercent': 0,
  'percentOff': null,
  'fixedAmount': 10000,
  'maxDiscount': null,
  'minOrderAmount': 50000,
  'restaurantId': 'restaurant-1',
  'expiresAt': '2027-01-01T00:00:00.000Z',
  'isUsed': false,
  'status': 'available',
  'usedAt': null,
};

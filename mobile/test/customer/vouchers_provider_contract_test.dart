import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/vouchers_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Voucher.fromJson', () {
    test('parses the backend customer promotion contract', () {
      final voucher = Voucher.fromJson(_availableVoucherPayload());

      expect(voucher.id, 'promotion-available');
      expect(voucher.code, 'SAVE20');
      expect(voucher.title, 'Save 20%');
      expect(voucher.description, '20% off dinner orders');
      expect(voucher.percentOff, 20);
      expect(voucher.maxDiscount, 50000);
      expect(voucher.minOrderAmount, 120000);
      expect(voucher.expiresAt, DateTime.parse('2027-01-01T00:00:00.000Z'));
      expect(voucher.isUsed, isFalse);
      expect(voucher.status, 'available');
    });

    test('accepts explicit null optional discount fields', () {
      final fixedVoucher = _availableVoucherPayload()
        ..['percentOff'] = null
        ..['maxDiscount'] = null;

      final voucher = Voucher.fromJson(fixedVoucher);

      expect(voucher.percentOff, isNull);
      expect(voucher.maxDiscount, isNull);
    });

    test(
      'rejects missing required display fields instead of faking blanks',
      () {
        final missingCode = _availableVoucherPayload()..remove('code');
        final missingTitle = _availableVoucherPayload()..remove('title');

        expect(
          () => Voucher.fromJson(missingCode),
          throwsA(isA<FormatException>()),
        );
        expect(
          () => Voucher.fromJson(missingTitle),
          throwsA(isA<FormatException>()),
        );
      },
    );

    test('rejects invalid status and timestamps', () {
      final invalidStatus = _availableVoucherPayload()..['status'] = 'draft';
      final invalidExpiry = _availableVoucherPayload()
        ..['expiresAt'] = 'not-a-date';

      expect(
        () => Voucher.fromJson(invalidStatus),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => Voucher.fromJson(invalidExpiry),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('VouchersNotifier.fetchVouchers', () {
    late _VouchersApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _VouchersApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test(
      'accepts the backend my and available promotion list contracts',
      () async {
        final notifier = VouchersNotifier();

        await notifier.fetchVouchers();

        expect(notifier.state.error, isNull);
        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.myVouchers, isEmpty);
        expect(notifier.state.expiredVouchers, hasLength(1));
        expect(notifier.state.expiredVouchers.single.code, 'USED10');
        expect(notifier.state.availableVouchers, hasLength(1));
        expect(notifier.state.availableVouchers.single.code, 'SAVE20');
      },
    );

    test('accepts explicitly empty promotion lists', () async {
      apiInterceptor.myPayload = [];
      apiInterceptor.availablePayload = [];
      final notifier = VouchersNotifier();

      await notifier.fetchVouchers();

      expect(notifier.state.error, isNull);
      expect(notifier.state.myVouchers, isEmpty);
      expect(notifier.state.availableVouchers, isEmpty);
      expect(notifier.state.expiredVouchers, isEmpty);
    });

    test('rejects envelope responses instead of faking empty lists', () async {
      apiInterceptor.availablePayload = {'vouchers': []};
      final notifier = VouchersNotifier();

      await notifier.fetchVouchers();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, 'VOUCHERS_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.myVouchers, isEmpty);
      expect(notifier.state.availableVouchers, isEmpty);
    });

    test(
      'rejects incomplete voucher rows instead of rendering blank cards',
      () async {
        apiInterceptor.availablePayload = [
          _availableVoucherPayload()..remove('status'),
        ];
        final notifier = VouchersNotifier();

        await notifier.fetchVouchers();

        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.error, 'VOUCHERS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.availableVouchers, isEmpty);
      },
    );
  });
}

class _VouchersApiInterceptor extends Interceptor {
  dynamic myPayload = [_usedVoucherPayload()];
  dynamic availablePayload = [_availableVoucherPayload()];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/promotions/my' && options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
          requestOptions: options,
          statusCode: 200,
          data: myPayload,
        ),
      );
      return;
    }

    if (options.path == '/promotions/available' && options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
          requestOptions: options,
          statusCode: 200,
          data: availablePayload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _availableVoucherPayload() => {
  'id': 'promotion-available',
  'code': 'SAVE20',
  'title': 'Save 20%',
  'name': 'Save 20%',
  'description': '20% off dinner orders',
  'type': 'percentage',
  'value': 20,
  'discountPercent': 20,
  'percentOff': 20,
  'fixedAmount': null,
  'maxDiscount': 50000,
  'minOrderAmount': 120000,
  'restaurantId': 'restaurant-1',
  'expiresAt': '2027-01-01T00:00:00.000Z',
  'isUsed': false,
  'status': 'available',
  'usedAt': null,
};

Map<String, dynamic> _usedVoucherPayload() => {
  'id': 'promotion-used',
  'code': 'USED10',
  'title': 'Used reward',
  'name': 'Used reward',
  'description': '',
  'type': 'fixed',
  'value': 10000,
  'discountPercent': 0,
  'percentOff': null,
  'fixedAmount': 10000,
  'maxDiscount': null,
  'minOrderAmount': 0,
  'restaurantId': 'restaurant-1',
  'expiresAt': '2027-01-01T00:00:00.000Z',
  'isUsed': true,
  'status': 'used',
  'usedAt': '2026-07-04T00:00:00.000Z',
};

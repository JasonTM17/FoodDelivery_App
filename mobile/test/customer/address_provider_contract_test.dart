import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/address_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AddressNotifier backend contract', () {
    late _AddressApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _AddressApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test(
      'fetchAddresses loads saved addresses with real coordinates',
      () async {
        final notifier = AddressNotifier();

        await notifier.fetchAddresses();

        expect(notifier.state.error, isNull);
        expect(notifier.state.addresses, hasLength(1));
        expect(notifier.state.addresses.single.id, 'addr-1');
        expect(notifier.state.addresses.single.latitude, 10.7769);
        expect(notifier.state.addresses.single.longitude, 106.7009);
      },
    );

    test(
      'fetchAddresses rejects envelopes instead of faking an empty list',
      () async {
        apiInterceptor.listPayload = {
          'addresses': [_addressPayload()],
        };
        final notifier = AddressNotifier();

        await notifier.fetchAddresses();

        expect(notifier.state.error, 'ADDRESSES_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.addresses, isEmpty);
      },
    );

    test('fetchAddresses rejects rows without coordinates', () async {
      apiInterceptor.listPayload = [_addressPayload()..remove('latitude')];
      final notifier = AddressNotifier();

      await notifier.fetchAddresses();

      expect(notifier.state.error, 'ADDRESSES_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.addresses, isEmpty);
    });

    test('addAddress posts map coordinates and uses the backend row', () async {
      final notifier = AddressNotifier();

      final saved = await notifier.addAddress(
        label: 'Home',
        address: '2 Le Loi',
        latitude: 10.7769,
        longitude: 106.7009,
        isDefault: true,
      );

      expect(saved, isTrue);
      expect(apiInterceptor.createdPayload, {
        'label': 'Home',
        'addressLine': '2 Le Loi',
        'latitude': 10.7769,
        'longitude': 106.7009,
        'apartmentNumber': null,
        'note': null,
        'isDefault': true,
      });
      expect(notifier.state.addresses.single.id, 'addr-created');
    });

    test(
      'updateAddress replaces local state with the backend response',
      () async {
        final notifier = AddressNotifier();
        await notifier.fetchAddresses();

        apiInterceptor.updatePayload = {
          ..._addressPayload(id: 'addr-1'),
          'label': 'Office from API',
          'addressLine': '99 Nguyen Hue',
          'isDefault': true,
        };
        final saved = await notifier.updateAddress(
          id: 'addr-1',
          label: 'Local label must not win',
        );

        expect(saved, isTrue);
        expect(apiInterceptor.updatedPayload, {
          'label': 'Local label must not win',
        });
        expect(notifier.state.addresses.single.label, 'Office from API');
        expect(notifier.state.addresses.single.address, '99 Nguyen Hue');
      },
    );
  });
}

class _AddressApiInterceptor extends Interceptor {
  dynamic listPayload = [_addressPayload()];
  Map<String, dynamic> createPayload = _addressPayload(id: 'addr-created');
  Map<String, dynamic> updatePayload = _addressPayload();
  Map<String, dynamic>? createdPayload;
  Map<String, dynamic>? updatedPayload;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/users/addresses' && options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
          requestOptions: options,
          statusCode: 200,
          data: listPayload,
        ),
      );
      return;
    }

    if (options.path == '/users/addresses' && options.method == 'POST') {
      createdPayload = Map<String, dynamic>.from(
        options.data as Map<dynamic, dynamic>,
      );
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 201,
          data: createPayload,
        ),
      );
      return;
    }

    if (options.path == '/users/addresses/addr-1' && options.method == 'PUT') {
      updatedPayload = Map<String, dynamic>.from(
        options.data as Map<dynamic, dynamic>,
      );
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: updatePayload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _addressPayload({String id = 'addr-1'}) => {
  'id': id,
  'label': 'Home',
  'addressLine': '2 Le Loi',
  'latitude': 10.7769,
  'longitude': 106.7009,
  'isDefault': true,
  'createdAt': '2026-07-06T00:00:00.000Z',
};

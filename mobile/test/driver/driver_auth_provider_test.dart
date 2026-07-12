import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _DriverAuthApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _DriverAuthApiInterceptor(
      profilePayload: _driverProfile(),
    );
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  test(
    'persists driver tokens before fetching the authenticated profile',
    () async {
      final notifier = DriverNotifier();

      await notifier.login('driver@foodflow.test', 'Password123');

      const storage = FlutterSecureStorage();
      expect(await storage.read(key: 'auth_token'), 'driver-access-token');
      expect(await storage.read(key: 'refresh_token'), 'driver-refresh-token');
      expect(apiInterceptor.profileAuthorization, 'Bearer driver-access-token');
      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.driverName, 'Driver One');
      expect(notifier.state.totalDeliveries, 42);
      expect(notifier.state.isVerified, isFalse);
      expect(notifier.state.hasAcceptedTerms, isTrue);
      expect(notifier.state.kycStatus, DriverKycStatus.pending);
    },
  );

  test('clears tokens and rejects non-driver profiles after login', () async {
    apiInterceptor.profilePayload = {
      'id': 'customer-1',
      'role': 'customer',
      'fullName': 'Customer One',
      'driverProfile': null,
    };
    final notifier = DriverNotifier();

    await notifier.login('customer@foodflow.test', 'Password123');

    const storage = FlutterSecureStorage();
    expect(apiInterceptor.profileAuthorization, 'Bearer driver-access-token');
    expect(await storage.read(key: 'auth_token'), isNull);
    expect(await storage.read(key: 'refresh_token'), isNull);
    expect(notifier.state.isAuthenticated, isFalse);
    expect(notifier.state.error, 'DRIVER_PROFILE_UNAVAILABLE');
  });

  test('clears tokens when the authenticated KYC status is invalid', () async {
    apiInterceptor.kycStatusPayload = {
      'status': 'unknown',
      'isVerified': false,
    };
    final notifier = DriverNotifier();

    await notifier.login('driver@foodflow.test', 'Password123');

    const storage = FlutterSecureStorage();
    expect(await storage.read(key: 'auth_token'), isNull);
    expect(notifier.state.isAuthenticated, isFalse);
    expect(notifier.state.error, 'DRIVER_KYC_STATUS_UNAVAILABLE');
  });
}

Map<String, dynamic> _driverProfile() => {
  'id': 'driver-1',
  'role': 'driver',
  'fullName': 'Driver One',
  'phone': '0900000000',
  'avatarUrl': null,
  'driverProfile': {
    'rating': 4.8,
    'totalDeliveries': 42,
    'totalEarnings': 1200000,
    'vehicleType': 'motorbike',
    'vehiclePlate': '59A1-12345',
    'isOnline': false,
    'isVerified': false,
    'termsAcceptedAt': '2026-07-10T14:00:00.000Z',
  },
};

class _DriverAuthApiInterceptor extends Interceptor {
  _DriverAuthApiInterceptor({required this.profilePayload});

  Map<String, dynamic> profilePayload;
  Map<String, dynamic> kycStatusPayload = {
    'status': 'pending',
    'isVerified': false,
  };
  String? profileAuthorization;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/auth/login') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {
            'accessToken': 'driver-access-token',
            'refreshToken': 'driver-refresh-token',
          },
        ),
      );
      return;
    }

    if (options.path == '/driver/kyc/status') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: kycStatusPayload,
        ),
      );
      return;
    }

    if (options.path == '/users/me') {
      profileAuthorization = options.headers['Authorization'] as String?;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: profilePayload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

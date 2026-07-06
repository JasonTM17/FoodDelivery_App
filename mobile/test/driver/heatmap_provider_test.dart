import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/heatmap_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('HeatmapPoint.fromJson', () {
    test('parses backend heatmap rows', () {
      final point = HeatmapPoint.fromJson({
        'lat': 10.7769,
        'lng': 106.7009,
        'demandLevel': 2,
        'orderCount': 12,
        'avgPayout': 32500,
      });

      expect(point.lat, 10.7769);
      expect(point.lng, 106.7009);
      expect(point.demandLevel, 2);
      expect(point.orderCount, 12);
      expect(point.avgPayout, 32500);
    });

    test('parses numeric strings without inventing fallback zeros', () {
      final point = HeatmapPoint.fromJson({
        'lat': '10.7769',
        'lng': '106.7009',
        'demandLevel': '1',
        'orderCount': '4',
        'avgPayout': '21000',
      });

      expect(point.demandLevel, 1);
      expect(point.orderCount, 4);
      expect(point.avgPayout, 21000);
    });

    test('rejects invalid demand levels instead of clamping to high', () {
      expect(
        () => HeatmapPoint.fromJson({
          'lat': 10.7769,
          'lng': 106.7009,
          'demandLevel': 99,
          'orderCount': 4,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects missing coordinates instead of defaulting to zero', () {
      expect(
        () => HeatmapPoint.fromJson({
          'demandLevel': 1,
          'orderCount': 4,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects coordinates outside the Vietnam delivery map', () {
      expect(
        () => HeatmapPoint.fromJson({
          'lat': 13.7563,
          'lng': 100.5018,
          'demandLevel': 1,
          'orderCount': 4,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects missing business metrics instead of faking zeros', () {
      expect(
        () => HeatmapPoint.fromJson({
          'lat': 10.7769,
          'lng': 106.7009,
          'demandLevel': 1,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => HeatmapPoint.fromJson({
          'lat': 10.7769,
          'lng': 106.7009,
          'demandLevel': 1,
          'orderCount': 4,
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('HeatmapNotifier', () {
    late _HeatmapApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _HeatmapApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test('does not load demand with invalid driver location', () async {
      final notifier = HeatmapNotifier();

      await notifier.loadHeatmap(0, 0);

      expect(notifier.state.points, isEmpty);
      expect(notifier.state.error, 'DRIVER_HEATMAP_LOCATION_REQUIRED');
      expect(notifier.state.selectedWindow, 'now');
      expect(notifier.state.isLoading, isFalse);
    });

    test('loads only complete backend heatmap rows', () async {
      final notifier = HeatmapNotifier();

      await notifier.loadHeatmap(10.7769, 106.7009);

      expect(notifier.state.error, isNull);
      expect(notifier.state.points, hasLength(1));
      expect(notifier.state.points.single.orderCount, 12);
    });

    test('rejects malformed heatmap rows instead of dropping them', () async {
      apiInterceptor.payload = [_heatmapPayload()..remove('avgPayout')];
      final notifier = HeatmapNotifier();

      await notifier.loadHeatmap(10.7769, 106.7009);

      expect(notifier.state.error, 'DRIVER_HEATMAP_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.points, isEmpty);
    });
  });
}

class _HeatmapApiInterceptor extends Interceptor {
  dynamic payload = [_heatmapPayload()];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/heatmap' && options.method == 'GET') {
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

Map<String, dynamic> _heatmapPayload() => {
  'lat': 10.7769,
  'lng': 106.7009,
  'demandLevel': 2,
  'orderCount': 12,
  'avgPayout': 32500,
};

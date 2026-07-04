import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/config/app_config.dart';

void main() {
  group('AppConfig', () {
    test('normalizes trailing slashes', () {
      expect(
        AppConfig.normalizeBaseUrl(' https://api.foodflow.vn/api/ '),
        'https://api.foodflow.vn/api',
      );
    });

    test('derives socket root from API base URL', () {
      expect(
        AppConfig.socketBaseUrlFromApiBaseUrl('https://api.foodflow.vn/api'),
        'https://api.foodflow.vn',
      );
      expect(
        AppConfig.socketBaseUrlFromApiBaseUrl('http://10.0.2.2:3001/api/'),
        'http://10.0.2.2:3001',
      );
    });

    test('debug and test builds keep a local development API URL', () {
      expect(AppConfig.apiBaseUrl, 'http://10.0.2.2:3001/api');
      expect(AppConfig.socketBaseUrl, 'http://10.0.2.2:3001');
    });
  });
}

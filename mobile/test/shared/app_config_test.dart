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

    test('normalizes canonical and legacy Socket.IO namespace URLs', () {
      expect(
        AppConfig.socketBaseUrlFromSocketUrl('https://api.foodflow.vn/events/'),
        'https://api.foodflow.vn',
      );
      expect(
        AppConfig.socketBaseUrlFromSocketUrl(
          'https://api.foodflow.vn/tracking',
        ),
        'https://api.foodflow.vn',
      );
      expect(
        AppConfig.socketBaseUrlFromSocketUrl('https://api.foodflow.vn'),
        'https://api.foodflow.vn',
      );
    });

    test(
      'uses a local API default and an optional configured socket origin',
      () {
        expect(AppConfig.apiBaseUrl, 'http://10.0.2.2:3001/api');

        const configuredSocketUrl = String.fromEnvironment('WS_URL');
        expect(
          AppConfig.socketBaseUrl,
          configuredSocketUrl.isEmpty
              ? 'http://10.0.2.2:3001'
              : AppConfig.socketBaseUrlFromSocketUrl(configuredSocketUrl),
        );
      },
    );

    test(
      'defaults only non-release builds to local Socket.IO compatibility',
      () {
        expect(
          parseRealtimeProvider('', isRelease: false),
          RealtimeProvider.socketio,
        );
        expect(
          () => parseRealtimeProvider('', isRelease: true),
          throwsStateError,
        );
      },
    );

    test('accepts only explicit realtime providers', () {
      expect(
        parseRealtimeProvider('supabase', isRelease: true),
        RealtimeProvider.supabase,
      );
      expect(
        () => parseRealtimeProvider('fallback', isRelease: false),
        throwsStateError,
      );
    });

    test('requires HTTPS Supabase URL in release builds', () {
      expect(
        validateSupabaseUrl('https://project.supabase.co/', isRelease: true),
        'https://project.supabase.co',
      );
      expect(
        () =>
            validateSupabaseUrl('http://project.supabase.co', isRelease: true),
        throwsStateError,
      );
    });

    test('rejects missing and placeholder Supabase publishable keys', () {
      expect(() => validateSupabasePublishableKey(''), throwsStateError);
      expect(
        () => validateSupabasePublishableKey('your-supabase-publishable-key'),
        throwsStateError,
      );
      expect(
        validateSupabasePublishableKey('sb_publishable_foodflow_test_key'),
        'sb_publishable_foodflow_test_key',
      );
    });
  });
}

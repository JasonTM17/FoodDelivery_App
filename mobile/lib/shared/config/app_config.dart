import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._();

  static const apiBaseUrlStorageKey = 'API_BASE_URL';

  static const _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');
  static const _wsUrlDefine = String.fromEnvironment('WS_URL');

  static const _debugApiBaseUrl = 'http://10.0.2.2:3001/api';

  static String get apiBaseUrl {
    final configured = normalizeBaseUrl(_apiBaseUrlDefine);
    if (configured.isNotEmpty) return configured;

    if (kReleaseMode) {
      throw StateError(
        'API_BASE_URL is required for release builds. '
        'Pass --dart-define=API_BASE_URL=https://api.foodflow.vn/api.',
      );
    }

    return _debugApiBaseUrl;
  }

  static String get socketBaseUrl {
    final configured = normalizeBaseUrl(_wsUrlDefine);
    if (configured.isNotEmpty) return stripApiSuffix(configured);
    return socketBaseUrlFromApiBaseUrl(apiBaseUrl);
  }

  static String normalizeBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }

  static String socketBaseUrlFromApiBaseUrl(String apiBaseUrl) {
    final normalized = normalizeBaseUrl(apiBaseUrl);
    return stripApiSuffix(normalized);
  }

  static String stripApiSuffix(String url) {
    final normalized = normalizeBaseUrl(url);
    if (normalized.endsWith('/api')) {
      return normalized.substring(0, normalized.length - 4);
    }
    return normalized;
  }
}

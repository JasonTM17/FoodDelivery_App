import 'package:flutter/foundation.dart';

enum RealtimeProvider { socketio, supabase }

RealtimeProvider parseRealtimeProvider(
  String value, {
  required bool isRelease,
}) {
  final normalized = value.trim().toLowerCase();
  if (normalized.isEmpty) {
    if (isRelease) {
      throw StateError('REALTIME_PROVIDER is required for release builds.');
    }
    return RealtimeProvider.socketio;
  }
  return switch (normalized) {
    'socketio' => RealtimeProvider.socketio,
    'supabase' => RealtimeProvider.supabase,
    _ => throw StateError(
      'REALTIME_PROVIDER must be either socketio or supabase.',
    ),
  };
}

String validateSupabaseUrl(String value, {required bool isRelease}) {
  final normalized = AppConfig.normalizeBaseUrl(value);
  final uri = Uri.tryParse(normalized);
  if (normalized.isEmpty || uri == null || !uri.hasAuthority) {
    throw StateError(
      'SUPABASE_URL is required when REALTIME_PROVIDER=supabase.',
    );
  }
  if (isRelease && uri.scheme != 'https') {
    throw StateError('SUPABASE_URL must use HTTPS in release builds.');
  }
  if (uri.scheme != 'https' && uri.scheme != 'http') {
    throw StateError('SUPABASE_URL must use HTTP or HTTPS.');
  }
  return normalized;
}

String validateSupabaseAnonKey(String value) {
  final normalized = value.trim();
  if (normalized.isEmpty ||
      normalized == 'your-supabase-anon-key' ||
      normalized.length < 20) {
    throw StateError(
      'SUPABASE_ANON_KEY is required when REALTIME_PROVIDER=supabase.',
    );
  }
  return normalized;
}

class AppConfig {
  AppConfig._();

  static const apiBaseUrlStorageKey = 'API_BASE_URL';

  static const _apiBaseUrlDefine = String.fromEnvironment('API_BASE_URL');
  static const _wsUrlDefine = String.fromEnvironment('WS_URL');
  static const _realtimeProviderDefine = String.fromEnvironment(
    'REALTIME_PROVIDER',
  );
  static const _supabaseUrlDefine = String.fromEnvironment('SUPABASE_URL');
  static const _supabaseAnonKeyDefine = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
  );

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

  static RealtimeProvider get realtimeProvider =>
      parseRealtimeProvider(_realtimeProviderDefine, isRelease: kReleaseMode);

  static String get supabaseUrl =>
      validateSupabaseUrl(_supabaseUrlDefine, isRelease: kReleaseMode);

  static String get supabaseAnonKey =>
      validateSupabaseAnonKey(_supabaseAnonKeyDefine);

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

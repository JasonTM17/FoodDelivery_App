import 'dart:async';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  static ApiClient? _instance;
  static final _logoutController = StreamController<void>.broadcast();
  static final _tokenRefreshController = StreamController<String>.broadcast();
  static final Random _idempotencyRandom = Random.secure();

  /// Emits when the session is forcibly cleared (refresh failure / logout).
  static Stream<void> get onLogout => _logoutController.stream;

  /// Emits the new access token after a successful silent refresh.
  static Stream<String> get onTokenRefreshed => _tokenRefreshController.stream;

  late final Dio dio;
  final FlutterSecureStorage _storage;

  ApiClient._() : _storage = const FlutterSecureStorage() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      _AuthInterceptor(_storage, dio),
      _LogInterceptor(),
      _ResponseInterceptor(),
    ]);
  }

  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  static Future<String?> get baseUrl async {
    final stored = await _instance?._storage.read(
      key: AppConfig.apiBaseUrlStorageKey,
    );
    if (stored != null && stored.trim().isNotEmpty) {
      return AppConfig.normalizeBaseUrl(stored);
    }
    return AppConfig.apiBaseUrl;
  }

  static void setBaseUrl(String url) {
    final normalized = AppConfig.normalizeBaseUrl(url);
    _instance?.dio.options.baseUrl = normalized;
    _instance?._storage.write(
      key: AppConfig.apiBaseUrlStorageKey,
      value: normalized,
    );
  }

  static String generateIdempotencyKey() {
    final bytes = List<int>.generate(
      16,
      (_) => _idempotencyRandom.nextInt(256),
      growable: false,
    );
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    final hex = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20),
    ].join('-');
  }

  /// Notify listeners that tokens were wiped (e.g. explicit logout).
  static void notifyLogout() {
    if (!_logoutController.isClosed) {
      _logoutController.add(null);
    }
  }

  // Convenience methods
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  /// Single-flight refresh: parallel 401s await the same Completer.
  Completer<String?>? _refreshCompleter;

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Refresh calls must not carry a stale access token.
    if (options.extra['_isRefreshCall'] == true) {
      options.headers.remove('Authorization');
      handler.next(options);
      return;
    }
    final token = await _storage.read(key: 'auth_token');
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final is401 = err.response?.statusCode == 401;
    final alreadyRetried = err.requestOptions.extra['_retried'] == true;
    final isRefreshCall =
        err.requestOptions.extra['_isRefreshCall'] == true ||
        err.requestOptions.path.contains('/auth/refresh');

    if (!is401 || alreadyRetried || isRefreshCall) {
      handler.next(err);
      return;
    }

    try {
      final newToken = await _refreshAccessToken();
      if (newToken != null && newToken.isNotEmpty) {
        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        err.requestOptions.extra['_retried'] = true;
        final retryResponse = await _dio.fetch(err.requestOptions);
        handler.resolve(retryResponse);
        return;
      }
    } catch (_) {
      // Fall through to original error after logout was triggered.
    }

    handler.next(err);
  }

  /// Single-flight token refresh. Concurrent callers share one network call.
  Future<String?> _refreshAccessToken() async {
    final inFlight = _refreshCompleter;
    if (inFlight != null) {
      return inFlight.future;
    }

    final completer = Completer<String?>();
    _refreshCompleter = completer;

    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null || refreshToken.isEmpty) {
        completer.complete(null);
        return null;
      }

      // Use the shared Dio so adapters/interceptors (and tests) apply.
      final res = await _dio.post<dynamic>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(
          extra: {'_isRefreshCall': true, '_retried': true},
          headers: {'Content-Type': 'application/json'},
        ),
      );

      if (res.statusCode != 200) {
        await _forceLogout();
        completer.complete(null);
        return null;
      }

      final body = res.data;
      final payload = _unwrapRefreshPayload(body);
      final newToken = payload['accessToken'] as String?;
      final newRefresh = payload['refreshToken'] as String?;

      if (newToken == null || newToken.isEmpty) {
        await _forceLogout();
        completer.complete(null);
        return null;
      }

      await _storage.write(key: 'auth_token', value: newToken);
      if (newRefresh != null && newRefresh.isNotEmpty) {
        await _storage.write(key: 'refresh_token', value: newRefresh);
      }

      if (!ApiClient._tokenRefreshController.isClosed) {
        ApiClient._tokenRefreshController.add(newToken);
      }

      completer.complete(newToken);
      return newToken;
    } catch (_) {
      await _forceLogout();
      completer.complete(null);
      return null;
    } finally {
      _refreshCompleter = null;
    }
  }

  Map<String, dynamic> _unwrapRefreshPayload(dynamic body) {
    if (body is Map<String, dynamic>) {
      if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
        return body['data'] as Map<String, dynamic>;
      }
      return body;
    }
    if (body is Map) {
      return Map<String, dynamic>.from(body);
    }
    return const {};
  }

  Future<void> _forceLogout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
    ApiClient.notifyLogout();
  }
}

class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint(
        '[HTTP] --> ${options.method} ${options.uri.origin}${options.path}',
      );
      if (options.data != null) {
        debugPrint('[HTTP] Body: ${redactHttpLogValue(options.data)}');
      }
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final requestId = response.headers.value('x-request-id') ?? '-';
    if (kDebugMode) {
      debugPrint(
        '[HTTP] <-- ${response.statusCode} ${response.requestOptions.path} [rid=$requestId]',
      );
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint(
        '[HTTP] <-- ERROR ${err.response?.statusCode} ${err.requestOptions.path}: ${err.message}',
      );
    }
    handler.next(err);
  }
}

class _ResponseInterceptor extends Interceptor {
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.data is Map<String, dynamic>) {
      final data = response.data as Map<String, dynamic>;
      if (data.containsKey('data')) {
        response.data = data['data'];
      }
    }
    handler.next(response);
  }
}

const Set<String> _sensitiveHttpLogKeys = {
  'authorization',
  'email',
  'name',
  'fullname',
  'password',
  'token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'secret',
  'apikey',
  'api_key',
  'phone',
  'address',
  'addressline',
  'apartmentnumber',
  'note',
  'notes',
  'comment',
  'message',
  'content',
  'instructions',
  'avatarurl',
  'payment',
  'paymentmethod',
  'card',
  'cvv',
  'documents',
  'documenturls',
  'objectkey',
  'licensenumber',
  'vehicleplate',
};

bool _isCoordinateHttpLogKey(String normalizedKey) {
  return normalizedKey == 'location' ||
      normalizedKey == 'coordinates' ||
      normalizedKey == 'latitude' ||
      normalizedKey == 'longitude' ||
      normalizedKey.endsWith('latitude') ||
      normalizedKey.endsWith('longitude') ||
      normalizedKey.endsWith('lat') ||
      normalizedKey.endsWith('lng');
}

Object? redactHttpLogValue(Object? value) {
  if (value is FormData) {
    return '[FormData fields=${value.fields.length} files=${value.files.length}]';
  }
  if (value is Map) {
    return value.map((key, nestedValue) {
      final keyText = key.toString();
      return MapEntry(
        keyText,
        _isSensitiveHttpLogKey(keyText)
            ? '[REDACTED]'
            : redactHttpLogValue(nestedValue),
      );
    });
  }
  if (value is Iterable && value is! String) {
    return value.map(redactHttpLogValue).toList(growable: false);
  }
  return value;
}

bool _isSensitiveHttpLogKey(String key) {
  final normalized = key.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  if (_isCoordinateHttpLogKey(normalized)) return true;
  return _sensitiveHttpLogKeys.any((sensitive) {
    final normalizedSensitive = sensitive.toLowerCase().replaceAll(
      RegExp(r'[^a-z0-9]'),
      '',
    );
    return normalized == normalizedSensitive ||
        normalized.contains(normalizedSensitive);
  });
}

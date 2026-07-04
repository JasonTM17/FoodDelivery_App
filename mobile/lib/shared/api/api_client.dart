import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  static ApiClient? _instance;
  static final _logoutController = StreamController<void>.broadcast();
  static Stream<void> get onLogout => _logoutController.stream;
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
    final ts = DateTime.now().millisecondsSinceEpoch;
    final rand = Object().hashCode ^ ts;
    return '${ts.toRadixString(16)}-${rand.abs().toRadixString(16)}';
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
  bool _isRefreshing = false;

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
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

    if (is401 && !alreadyRetried && !_isRefreshing) {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null && refreshToken.isNotEmpty) {
        _isRefreshing = true;
        try {
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: err.requestOptions.baseUrl,
              headers: {'Content-Type': 'application/json'},
            ),
          );
          final res = await refreshDio.post(
            '/auth/refresh',
            data: {'refreshToken': refreshToken},
          );
          if (res.statusCode == 200) {
            final body = res.data;
            final payload =
                (body is Map<String, dynamic> && body.containsKey('data'))
                ? (body['data'] as Map<String, dynamic>? ?? body)
                : body as Map<String, dynamic>;
            final newToken = payload['accessToken'] as String?;
            final newRefresh = payload['refreshToken'] as String?;
            if (newToken != null) {
              await _storage.write(key: 'auth_token', value: newToken);
              if (newRefresh != null) {
                await _storage.write(key: 'refresh_token', value: newRefresh);
              }
              err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
              err.requestOptions.extra['_retried'] = true;
              final retryResponse = await _dio.fetch(err.requestOptions);
              handler.resolve(retryResponse);
              return;
            }
          }
        } catch (_) {
          await _storage.delete(key: 'auth_token');
          await _storage.delete(key: 'refresh_token');
          ApiClient._logoutController.add(null);
        } finally {
          _isRefreshing = false;
        }
      }
    }
    handler.next(err);
  }
}

class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // ignore: avoid_print
    print('[HTTP] --> ${options.method} ${options.path}');
    if (options.data != null) {
      // ignore: avoid_print
      print('[HTTP] Body: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final requestId = response.headers.value('x-request-id') ?? '-';
    // ignore: avoid_print
    print(
      '[HTTP] <-- ${response.statusCode} ${response.requestOptions.path} [rid=$requestId]',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // ignore: avoid_print
    print(
      '[HTTP] <-- ERROR ${err.response?.statusCode} ${err.requestOptions.path}: ${err.message}',
    );
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

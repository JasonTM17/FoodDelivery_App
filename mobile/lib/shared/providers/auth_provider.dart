import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../api/socket_client.dart';
import '../models/user.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? error;
  final bool isInitialized;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
    this.isInitialized = false,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? error,
    bool? isInitialized,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error,
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final ApiClient _api = ApiClient.instance;
  final SocketClient _socket = SocketClient.instance;
  StreamSubscription<void>? _logoutSub;
  StreamSubscription<String>? _tokenRefreshSub;

  AuthNotifier() : super(const AuthState()) {
    // B-MOB-04: clear session when API layer force-logs out (refresh failure).
    _logoutSub = ApiClient.onLogout.listen((_) {
      _socket.disconnect();
      if (!mounted) return;
      state = const AuthState(isInitialized: true);
    });

    // B-MOB-05: reconnect sockets with the new access token after silent refresh.
    _tokenRefreshSub = ApiClient.onTokenRefreshed.listen((newToken) {
      if (_socket.isConnected) {
        unawaited(_socket.reconnectWithToken(newToken));
      }
    });
  }

  @override
  void dispose() {
    _logoutSub?.cancel();
    _tokenRefreshSub?.cancel();
    super.dispose();
  }

  Future<void> checkAuthStatus() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null || token.isEmpty) {
        state = const AuthState(isInitialized: true);
        return;
      }

      try {
        final response = await _api.get('/auth/profile');
        final user = UserModel.fromJson(
          response.data as Map<String, dynamic>,
        );
        state = AuthState(
          isAuthenticated: true,
          user: user,
          isInitialized: true,
        );
        return;
      } on DioException catch (e) {
        // B-MOB-07: only clear tokens on definitive auth failure (401).
        // Network / 5xx keep tokens so the next cold start can retry.
        final status = e.response?.statusCode;
        if (status == 401) {
          final refreshed = await _tryRefreshToken();
          if (refreshed) {
            try {
              final response = await _api.get('/auth/profile');
              final user = UserModel.fromJson(
                response.data as Map<String, dynamic>,
              );
              state = AuthState(
                isAuthenticated: true,
                user: user,
                isInitialized: true,
              );
              return;
            } on DioException catch (retryError) {
              if (retryError.response?.statusCode == 401) {
                await _clearTokens();
              }
            } catch (_) {
              // Profile parse failure after refresh — keep tokens.
            }
          } else {
            await _clearTokens();
          }
        }
        // Network or non-401: keep tokens, stay unauthenticated for this session.
        state = const AuthState(isInitialized: true);
        return;
      } catch (_) {
        // Non-Dio failure (parse, etc.) — keep tokens.
        state = const AuthState(isInitialized: true);
        return;
      }
    } catch (_) {
      state = const AuthState(isInitialized: true);
    }
  }

  /// Attempts a manual refresh when the interceptor path may not have run.
  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final response = await _api.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String?;
      final newRefresh = data['refreshToken'] as String?;
      if (accessToken == null || accessToken.isEmpty) return false;

      await _storage.write(key: 'auth_token', value: accessToken);
      if (newRefresh != null && newRefresh.isNotEmpty) {
        await _storage.write(key: 'refresh_token', value: newRefresh);
      }
      if (_socket.isConnected) {
        await _socket.reconnectWithToken(accessToken);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['token'] as String? ?? '';
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;

      // B-MOB-12: never mark authenticated with an empty access token.
      if (accessToken.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
        );
        return;
      }

      await _storage.write(key: 'auth_token', value: accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.write(key: 'refresh_token', value: refreshToken);
      }

      UserModel? user;
      if (data['user'] != null) {
        user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        final profileResponse = await _api.get('/auth/profile');
        user = UserModel.fromJson(profileResponse.data as Map<String, dynamic>);
      }

      state = AuthState(isAuthenticated: true, user: user, isInitialized: true);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: message,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại.',
      );
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // B-MOB-02: backend register schema is strict and rejects `role`.
      final response = await _api.post(
        '/auth/register',
        data: {
          'fullName': fullName,
          'email': email,
          'phone': phone,
          'password': password,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['token'] as String? ?? '';

      if (accessToken.isEmpty) {
        state = AuthState(
          isAuthenticated: false,
          isInitialized: true,
          error: 'Đăng ký thất bại. Vui lòng thử lại.',
        );
        return;
      }

      await _storage.write(key: 'auth_token', value: accessToken);
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.write(key: 'refresh_token', value: refreshToken);
      }

      final user = data['user'] != null
          ? UserModel.fromJson(data['user'] as Map<String, dynamic>)
          : null;

      state = AuthState(
        isAuthenticated: true,
        user: user,
        isInitialized: true,
      );
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Đăng ký thất bại. Vui lòng thử lại.';
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: message,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại.',
      );
    }
  }

  Future<void> logout() async {
    // B-MOB-05: disconnect sockets on logout.
    _socket.disconnect();
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Ignore logout API errors
    }
    await _clearTokens();
    state = const AuthState(isInitialized: true);
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _api.patch('/auth/profile', data: data);
      final user = UserModel.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(isLoading: false, user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Cập nhật thất bại.');
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

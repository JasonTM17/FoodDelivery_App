import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../api/realtime_client.dart';
import '../models/user.dart';
import '../notifications/firebase_fcm_token_session.dart';
import '../utils/auth_validation.dart';

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
  final RealtimeClient _realtime = RealtimeClient.instance;

  AuthNotifier() : super(const AuthState());

  Future<void> checkAuthStatus() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      if (token != null && token.isNotEmpty) {
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
          await _connectRealtime();
          unawaited(FcmTokenSession.activate());
          return;
        } catch (e) {
          await _realtime.disconnect();
          await _storage.delete(key: 'auth_token');
          await _storage.delete(key: 'refresh_token');
        }
      }
      state = const AuthState(isInitialized: true);
    } catch (e) {
      state = const AuthState(isInitialized: true);
    }
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

      await _storage.write(key: 'auth_token', value: accessToken);
      if (refreshToken != null) {
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
      await _connectRealtime();
      unawaited(FcmTokenSession.activate());
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
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
      final response = await _api.post(
        '/auth/register',
        data: {
          'fullName': fullName,
          'email': email,
          'phone': normalizePhoneForApi(phone),
          'password': password,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['token'] as String? ?? '';

      if (accessToken.isNotEmpty) {
        await _storage.write(key: 'auth_token', value: accessToken);
        final refreshToken =
            data['refreshToken'] as String? ?? data['refresh_token'] as String?;
        if (refreshToken != null) {
          await _storage.write(key: 'refresh_token', value: refreshToken);
        }
      }

      final user = data['user'] != null
          ? UserModel.fromJson(data['user'] as Map<String, dynamic>)
          : null;

      state = AuthState(
        isAuthenticated: accessToken.isNotEmpty,
        user: user,
        isInitialized: true,
      );
      if (accessToken.isNotEmpty) {
        await _connectRealtime();
        unawaited(FcmTokenSession.activate());
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Đăng ký thất bại. Vui lòng thử lại.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra. Vui lòng thử lại.',
      );
    }
  }

  Future<void> logout() async {
    try {
      await FcmTokenSession.deactivate().timeout(const Duration(seconds: 2));
    } catch (_) {
      // Push cleanup is best effort and must not strand a local session.
    }
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Ignore logout API errors
    }
    await _realtime.disconnect();
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
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

  Future<void> _connectRealtime() async {
    try {
      await _realtime.connect();
    } catch (_) {
      state = state.copyWith(error: 'REALTIME_UNAVAILABLE');
    }
  }
}

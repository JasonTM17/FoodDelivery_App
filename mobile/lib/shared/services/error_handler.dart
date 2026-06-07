import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

abstract class AppError {
  final String message;
  const AppError(this.message);
}

class NetworkError extends AppError {
  const NetworkError([super.message = 'Không có kết nối mạng. Vui lòng kiểm tra lại.']);
}

class AuthError extends AppError {
  const AuthError(
      [super.message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.']);
}

class ValidationError extends AppError {
  final Map<String, dynamic>? fields;
  const ValidationError(super.message, {this.fields});
}

class ServerError extends AppError {
  final int? statusCode;
  const ServerError([super.message = 'Lỗi máy chủ. Vui lòng thử lại sau.', this.statusCode]);
}

class NotFoundError extends AppError {
  const NotFoundError([super.message = 'Không tìm thấy dữ liệu yêu cầu.']);
}

class ErrorHandler {
  static AppError fromDioException(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return const NetworkError('Kết nối quá thời gian. Vui lòng thử lại.');
    }

    if (e.type == DioExceptionType.connectionError) {
      if (e.error is SocketException) return const NetworkError();
      return const NetworkError('Không thể kết nối đến máy chủ.');
    }

    final statusCode = e.response?.statusCode;
    final responseData = e.response?.data;
    final serverMessage = _extractMessage(responseData);

    switch (statusCode) {
      case 400:
        final fields = _extractFields(responseData);
        return ValidationError(serverMessage ?? 'Dữ liệu không hợp lệ.', fields: fields);
      case 401:
        return AuthError(
            serverMessage ?? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      case 403:
        return const AuthError('Bạn không có quyền thực hiện thao tác này.');
      case 404:
        return NotFoundError(serverMessage ?? 'Không tìm thấy dữ liệu yêu cầu.');
      case 422:
        final fields = _extractFields(responseData);
        return ValidationError(serverMessage ?? 'Dữ liệu không hợp lệ.', fields: fields);
      case 429:
        return const ServerError('Quá nhiều yêu cầu. Vui lòng thử lại sau.', 429);
      default:
        if (statusCode != null && statusCode >= 500) {
          return ServerError(
              serverMessage ?? 'Lỗi máy chủ. Vui lòng thử lại sau.', statusCode);
        }
        return ServerError(serverMessage ?? 'Có lỗi xảy ra. Vui lòng thử lại.', statusCode);
    }
  }

  static AppError fromException(Object e) {
    if (e is DioException) return fromDioException(e);
    if (e is SocketException) return const NetworkError();
    return const ServerError('Có lỗi xảy ra. Vui lòng thử lại.');
  }

  static void showSnackBar(BuildContext context, AppError error) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(error.message),
        backgroundColor: _colorForError(error),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        action: error is NetworkError
            ? SnackBarAction(
                label: 'OK',
                textColor: Colors.white,
                onPressed: () => messenger.hideCurrentSnackBar(),
              )
            : null,
      ),
    );
  }

  static void showDioError(BuildContext context, DioException e) {
    showSnackBar(context, fromDioException(e));
  }

  static void showGenericError(BuildContext context, [String? message]) {
    showSnackBar(
      context,
      ServerError(message ?? 'Có lỗi xảy ra. Vui lòng thử lại.'),
    );
  }

  // Sentry stub — swap body for Sentry.captureException(error, stackTrace: stackTrace)
  static void logToSentry(Object error, [StackTrace? stackTrace]) {
    // ignore: avoid_print
    print('[Sentry stub] $error\n$stackTrace');
  }

  static String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['message'] as String? ?? data['error'] as String?;
    }
    return null;
  }

  static Map<String, dynamic>? _extractFields(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['errors'] as Map<String, dynamic>?;
    }
    return null;
  }

  static Color _colorForError(AppError error) {
    if (error is AuthError) return const Color(0xFFD32F2F);
    if (error is NetworkError) return const Color(0xFF1565C0);
    if (error is ValidationError) return const Color(0xFFF57F17);
    return const Color(0xFF424242);
  }
}

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';
import '../../shared/utils/backend_date_time.dart';

final driverNotificationsProvider =
    StateNotifierProvider<
      DriverNotificationsNotifier,
      DriverNotificationsState
    >((ref) {
      return DriverNotificationsNotifier();
    });

class DriverNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final String? deepLink;

  const DriverNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.isRead,
    this.deepLink,
  });

  factory DriverNotification.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    final payload = data == null ? null : _requiredObject(data, 'data');
    return DriverNotification(
      id: _requiredString(json, 'id'),
      type: _requiredString(json, 'type'),
      title: _requiredString(json, 'title'),
      body: _requiredString(json, 'body'),
      createdAt: parseBackendDateTimeOrUnknown(json['createdAt']),
      isRead: _requiredBool(json, 'isRead'),
      deepLink:
          _optionalString(json, 'deepLink') ??
          (payload == null ? null : _optionalString(payload, 'deepLink')),
    );
  }

  DriverNotification copyWith({bool? isRead}) {
    return DriverNotification(
      id: id,
      type: type,
      title: title,
      body: body,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      deepLink: deepLink,
    );
  }
}

class DriverNotificationsState {
  final bool isLoading;
  final String? error;
  final List<DriverNotification> notifications;
  final int unreadCount;

  const DriverNotificationsState({
    this.isLoading = false,
    this.error,
    this.notifications = const [],
    this.unreadCount = 0,
  });

  DriverNotificationsState copyWith({
    bool? isLoading,
    String? error,
    List<DriverNotification>? notifications,
    int? unreadCount,
  }) {
    return DriverNotificationsState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class DriverNotificationsNotifier
    extends StateNotifier<DriverNotificationsState> {
  final ApiClient _api;

  DriverNotificationsNotifier({ApiClient? apiClient})
    : _api = apiClient ?? ApiClient.instance,
      super(const DriverNotificationsState());

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get<dynamic>('/notifications');
      final envelope = _parseNotificationEnvelope(response.data);
      state = state.copyWith(
        isLoading: false,
        notifications: envelope.notifications,
        unreadCount: envelope.unreadCount,
      );
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        notifications: const [],
        unreadCount: 0,
        error: 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE',
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _errorMessage(error));
    }
  }

  Future<void> markRead(String id) async {
    final previous = state;
    final updated = state.notifications
        .map(
          (notification) => notification.id == id
              ? notification.copyWith(isRead: true)
              : notification,
        )
        .toList();
    state = state.copyWith(
      notifications: updated,
      unreadCount: updated.where((notification) => !notification.isRead).length,
    );
    try {
      await _api.patch<dynamic>('/notifications/$id/read');
    } catch (_) {
      state = previous;
    }
  }

  Future<void> markAllRead() async {
    final previous = state;
    final updated = state.notifications
        .map((notification) => notification.copyWith(isRead: true))
        .toList();
    state = state.copyWith(notifications: updated, unreadCount: 0);
    try {
      await _api.patch<dynamic>('/notifications/read-all');
    } catch (_) {
      state = previous;
    }
  }
}

class _NotificationEnvelope {
  final List<DriverNotification> notifications;
  final int unreadCount;

  const _NotificationEnvelope({
    required this.notifications,
    required this.unreadCount,
  });
}

_NotificationEnvelope _parseNotificationEnvelope(dynamic data) {
  final envelope = _requiredObject(data, 'notifications envelope');
  final rows = _requiredList(envelope, 'notifications');
  final notifications = rows
      .whereType<Map>()
      .map(
        (item) => DriverNotification.fromJson(Map<String, dynamic>.from(item)),
      )
      .toList(growable: false);
  if (notifications.length != rows.length) {
    throw const FormatException('Invalid notification row');
  }
  _validatePaginationMeta(envelope['meta']);
  return _NotificationEnvelope(
    notifications: notifications,
    unreadCount: _requiredNonNegativeInt(envelope, 'unreadCount'),
  );
}

Map<String, dynamic> _requiredObject(dynamic value, String field) {
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  throw FormatException('Missing required notification object field: $field');
}

List<dynamic> _requiredList(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is List) return value;
  throw FormatException('Missing required notification list field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) return value;
  throw FormatException('Missing required notification string field: $field');
}

String? _optionalString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value == null) return null;
  if (value is String) return value;
  throw FormatException('Invalid optional notification string field: $field');
}

bool _requiredBool(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is bool) return value;
  throw FormatException('Missing required notification boolean field: $field');
}

int _requiredNonNegativeInt(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is int && value >= 0) return value;
  throw FormatException('Missing required notification integer field: $field');
}

void _validatePaginationMeta(dynamic value) {
  final meta = _requiredObject(value, 'meta');
  _requiredNonNegativeInt(meta, 'page');
  _requiredNonNegativeInt(meta, 'limit');
  _requiredNonNegativeInt(meta, 'total');
}

String _errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['detail'] is String)
      return data['detail'] as String;
    if (data is Map && data['message'] is String)
      return data['message'] as String;
    if (error.message != null && error.message!.isNotEmpty)
      return error.message!;
  }
  return error.toString();
}

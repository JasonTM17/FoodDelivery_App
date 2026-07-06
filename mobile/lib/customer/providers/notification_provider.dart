import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/socket_client.dart';
import '../../shared/utils/backend_date_time.dart';

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
      return NotificationNotifier();
    });

class NotificationModel {
  final String id;
  final String type; // order | promo | system
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final String? deepLink;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.isRead,
    this.deepLink,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    final payload = data == null ? null : _requiredObject(data, 'data');
    return NotificationModel(
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

  NotificationModel copyWith({bool? isRead}) => NotificationModel(
    id: id,
    type: type,
    title: title,
    body: body,
    createdAt: createdAt,
    isRead: isRead ?? this.isRead,
    deepLink: deepLink,
  );
}

class NotificationState {
  final bool isLoading;
  final String? error;
  final List<NotificationModel> notifications;
  final int unreadCount;

  const NotificationState({
    this.isLoading = false,
    this.error,
    this.notifications = const [],
    this.unreadCount = 0,
  });

  NotificationState copyWith({
    bool? isLoading,
    String? error,
    List<NotificationModel>? notifications,
    int? unreadCount,
  }) {
    return NotificationState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final ApiClient _api;
  StreamSubscription<Map<String, dynamic>>? _notifSub;

  NotificationNotifier({ApiClient? apiClient})
    : _api = apiClient ?? ApiClient.instance,
      super(const NotificationState()) {
    _subscribeToWs();
  }

  void _subscribeToWs() {
    _notifSub = SocketClient.instance.onNotification.listen((data) {
      try {
        final notif = NotificationModel.fromJson(data);
        state = state.copyWith(
          notifications: [notif, ...state.notifications],
          unreadCount: state.unreadCount + (notif.isRead ? 0 : 1),
        );
      } on FormatException {
        state = state.copyWith(
          error: 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE',
        );
      }
    });
  }

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
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ?? 'Không thể tải thông báo.';
      state = state.copyWith(isLoading: false, error: message);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        notifications: const [],
        unreadCount: 0,
        error: 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE',
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải thông báo.',
      );
    }
  }

  Future<void> markRead(String id) async {
    // Optimistic update
    final updated = state.notifications
        .map((n) => n.id == id ? n.copyWith(isRead: true) : n)
        .toList();
    state = state.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );
    try {
      await _api.patch('/notifications/$id/read');
    } on DioException catch (_) {
      // Rollback on failure
      await fetchNotifications();
    }
  }

  Future<void> markAllRead() async {
    final updated = state.notifications
        .map((n) => n.copyWith(isRead: true))
        .toList();
    state = state.copyWith(notifications: updated, unreadCount: 0);
    try {
      await _api.patch('/notifications/read-all');
    } on DioException catch (_) {
      await fetchNotifications();
    }
  }

  void clearError() => state = state.copyWith(error: null);

  @override
  void dispose() {
    _notifSub?.cancel();
    super.dispose();
  }
}

class _NotificationEnvelope {
  final List<NotificationModel> notifications;
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
      .map(
        (item) => NotificationModel.fromJson(
          _requiredObject(item, 'notifications[]'),
        ),
      )
      .toList(growable: false);
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

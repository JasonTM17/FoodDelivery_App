import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';

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
    final payload = data is Map
        ? Map<String, dynamic>.from(data)
        : const <String, dynamic>{};
    return DriverNotification(
      id: json['id'] as String? ?? '',
      type:
          json['type'] as String? ??
          payload['eventType'] as String? ??
          'system',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? false,
      deepLink: json['deepLink'] as String? ?? payload['deepLink'] as String?,
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
      final notifications = _parseNotifications(response.data);
      final unreadCount = _parseUnreadCount(response.data, notifications);
      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
        unreadCount: unreadCount,
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

List<DriverNotification> _parseNotifications(dynamic data) {
  final list = data is Map ? data['notifications'] : data;
  if (list is! List) return const [];
  return list
      .whereType<Map>()
      .map(
        (item) => DriverNotification.fromJson(Map<String, dynamic>.from(item)),
      )
      .toList();
}

int _parseUnreadCount(dynamic data, List<DriverNotification> notifications) {
  if (data is Map && data['unreadCount'] is num) {
    return (data['unreadCount'] as num).toInt();
  }
  return notifications.where((notification) => !notification.isRead).length;
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

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
    this.isRead = false,
    this.deepLink,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'system',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      createdAt: parseBackendDateTimeOrUnknown(json['createdAt']),
      isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? false,
      deepLink: json['deepLink'] as String?,
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
  final ApiClient _api = ApiClient.instance;
  StreamSubscription<Map<String, dynamic>>? _notifSub;

  NotificationNotifier() : super(const NotificationState()) {
    _subscribeToWs();
  }

  void _subscribeToWs() {
    _notifSub = SocketClient.instance.onNotification.listen((data) {
      final notif = NotificationModel.fromJson(data);
      state = state.copyWith(
        notifications: [notif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      );
    });
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/notifications');
      final dataList = response.data as List<dynamic>;
      final notifications = dataList
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final unread = notifications.where((n) => !n.isRead).length;
      state = state.copyWith(
        isLoading: false,
        notifications: notifications,
        unreadCount: unread,
      );
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ?? 'Không thể tải thông báo.';
      state = state.copyWith(isLoading: false, error: message);
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

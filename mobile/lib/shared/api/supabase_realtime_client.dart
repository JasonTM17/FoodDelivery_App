import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase/supabase.dart';
import '../config/app_config.dart';
import 'api_client.dart';
import 'realtime_transport.dart';

const _tokenRefreshSkew = Duration(seconds: 45);
const _tokenRefreshRetry = Duration(seconds: 5);
const _subscribeTimeout = Duration(seconds: 15);

class RealtimeTokenGrant {
  final String token;
  final DateTime expiresAt;
  final List<String> channels;

  const RealtimeTokenGrant({
    required this.token,
    required this.expiresAt,
    required this.channels,
  });

  factory RealtimeTokenGrant.fromJson(dynamic value) {
    if (value is! Map) {
      throw const FormatException('Realtime token response must be an object');
    }
    final json = Map<String, dynamic>.from(value);
    if (json['provider'] != 'supabase') {
      throw const FormatException('Realtime provider must be supabase');
    }
    final token = json['token'];
    final expiresAtRaw = json['expiresAt'];
    final channelsRaw = json['channels'];
    if (token is! String || token.trim().isEmpty) {
      throw const FormatException('Realtime token is missing');
    }
    if (expiresAtRaw is! String) {
      throw const FormatException('Realtime token expiry is missing');
    }
    final expiresAt = DateTime.tryParse(expiresAtRaw)?.toUtc();
    if (expiresAt == null) {
      throw const FormatException('Realtime token expiry is invalid');
    }
    if (channelsRaw is! List || channelsRaw.isEmpty) {
      throw const FormatException('Realtime channel allowlist is missing');
    }
    final channels = channelsRaw
        .map((channel) {
          if (channel is! String || !channel.startsWith('private:')) {
            throw const FormatException('Realtime channel must be private');
          }
          return channel;
        })
        .toSet()
        .toList(growable: false);

    return RealtimeTokenGrant(
      token: token,
      expiresAt: expiresAt,
      channels: channels,
    );
  }
}

class SupabaseRealtimeClient implements RealtimeTransport {
  final ApiClient _api;
  final SupabaseClient _client;
  final _channels = <String, RealtimeChannel>{};
  final _subscribedChannels = <String>{};

  final _driverLocationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _etaController = StreamController<Map<String, dynamic>>.broadcast();
  final _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _driverOfferController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _driverOrderAssignedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _authRefreshController = StreamController<void>.broadcast();

  Timer? _refreshTimer;
  Future<void>? _refreshInFlight;
  DateTime? _tokenExpiresAt;
  String? _activeOrderId;
  int _scopeVersion = 0;
  bool _active = false;

  SupabaseRealtimeClient({ApiClient? apiClient, SupabaseClient? client})
    : _api = apiClient ?? ApiClient.instance,
      _client =
          client ??
          SupabaseClient(
            AppConfig.supabaseUrl,
            AppConfig.supabasePublishableKey,
          );

  @override
  bool get isConnected =>
      _channels.isNotEmpty && _subscribedChannels.length == _channels.length;

  @override
  Stream<Map<String, dynamic>> get onDriverLocation =>
      _driverLocationController.stream;
  @override
  Stream<Map<String, dynamic>> get onOrderStatus =>
      _orderStatusController.stream;
  @override
  Stream<Map<String, dynamic>> get onEtaUpdate => _etaController.stream;
  @override
  Stream<Map<String, dynamic>> get onNotification =>
      _notificationController.stream;
  @override
  Stream<Map<String, dynamic>> get onDriverOffer =>
      _driverOfferController.stream;
  @override
  Stream<Map<String, dynamic>> get onDriverOrderAssigned =>
      _driverOrderAssignedController.stream;
  @override
  Stream<void> get onAuthRefreshRequired => _authRefreshController.stream;

  @override
  Future<void> connect() async {
    _active = true;
    await _refreshAndSync();
  }

  @override
  Future<void> subscribeOrder(String orderId) async {
    if (orderId.trim().isEmpty) {
      throw ArgumentError.value(orderId, 'orderId', 'must not be empty');
    }
    _activeOrderId = orderId;
    _scopeVersion += 1;
    _active = true;
    await _refreshAndSync();
  }

  @override
  Future<void> unsubscribeOrder(String orderId) async {
    if (_activeOrderId != orderId) return;
    _activeOrderId = null;
    _scopeVersion += 1;
    if (_active) await _refreshAndSync();
  }

  @override
  Future<void> reconnectWithToken(String newToken) async {
    // Application access-token persistence is handled by ApiClient. Request a
    // fresh scoped Supabase grant rather than reusing the application JWT.
    await _refreshAndSync();
  }

  Future<void> _refreshAndSync() {
    final current = _refreshInFlight;
    if (current != null) return current;
    final refresh = _performRefreshLoop();
    _refreshInFlight = refresh;
    return refresh.whenComplete(() {
      if (identical(_refreshInFlight, refresh)) _refreshInFlight = null;
    });
  }

  Future<void> _performRefreshLoop() async {
    while (_active) {
      final version = _scopeVersion;
      await _performRefresh(version);
      if (version == _scopeVersion) return;
    }
  }

  Future<void> _performRefresh(int version) async {
    final requestedOrderId = _activeOrderId;
    final scope = <String, dynamic>{
      if (requestedOrderId != null) 'orderId': requestedOrderId,
    };
    final response = await _api.post<dynamic>('/realtime/token', data: scope);
    final grant = RealtimeTokenGrant.fromJson(response.data);
    if (grant.expiresAt.isBefore(DateTime.now().toUtc())) {
      throw const FormatException('Realtime token is already expired');
    }
    if (requestedOrderId != null &&
        !grant.channels.contains('private:order:$requestedOrderId')) {
      throw const FormatException(
        'Realtime token does not authorize the requested order channel',
      );
    }

    // A baseline notification request may race with a newly selected order.
    // Discard the narrower grant and let the loop request the latest scope.
    if (!_active || version != _scopeVersion) return;

    await _client.realtime.setAuth(grant.token);
    if (!_active) return;
    await _syncChannels(grant.channels.toSet());
    _tokenExpiresAt = grant.expiresAt;
    _scheduleRefresh(grant.expiresAt);
  }

  Future<void> _syncChannels(Set<String> allowedChannels) async {
    final stale = _channels.keys
        .where((channel) => !allowedChannels.contains(channel))
        .toList(growable: false);
    for (final channelName in stale) {
      final channel = _channels.remove(channelName);
      _subscribedChannels.remove(channelName);
      if (channel != null) await _client.removeChannel(channel);
    }

    final additions = allowedChannels
        .where((channel) => !_channels.containsKey(channel))
        .map(_subscribeChannel);
    await Future.wait(additions);
  }

  Future<void> _subscribeChannel(String channelName) async {
    final completer = Completer<void>();
    final channel = _client.channel(
      channelName,
      opts: const RealtimeChannelConfig(private: true),
    );
    for (final event in _supportedBroadcastEvents) {
      channel.onBroadcast(
        event: event,
        callback: (payload) => dispatchRealtimeBroadcastEvent(
          event,
          payload,
          onDriverLocation: _driverLocationController.add,
          onOrderStatus: _orderStatusController.add,
          onEtaUpdate: _etaController.add,
          onNotification: _notificationController.add,
          onDriverOffer: _driverOfferController.add,
          onDriverOrderAssigned: _driverOrderAssignedController.add,
        ),
      );
    }
    channel.subscribe((status, error) {
      switch (status) {
        case RealtimeSubscribeStatus.subscribed:
          _subscribedChannels.add(channelName);
          if (!completer.isCompleted) completer.complete();
        case RealtimeSubscribeStatus.channelError:
        case RealtimeSubscribeStatus.timedOut:
          _subscribedChannels.remove(channelName);
          if (!completer.isCompleted) {
            completer.completeError(
              StateError('Supabase channel subscription failed: $channelName'),
            );
          }
        case RealtimeSubscribeStatus.closed:
          _subscribedChannels.remove(channelName);
      }
    });
    _channels[channelName] = channel;

    try {
      await completer.future.timeout(_subscribeTimeout);
    } catch (_) {
      _channels.remove(channelName);
      _subscribedChannels.remove(channelName);
      await _client.removeChannel(channel);
      rethrow;
    }
  }

  void _scheduleRefresh(DateTime expiresAt) {
    _refreshTimer?.cancel();
    final now = DateTime.now().toUtc();
    final refreshAt = expiresAt.subtract(_tokenRefreshSkew);
    final delay = refreshAt.isAfter(now)
        ? refreshAt.difference(now)
        : const Duration(seconds: 1);
    _refreshTimer = Timer(delay, () {
      unawaited(_refreshAfterTimer());
    });
  }

  Future<void> _refreshAfterTimer() async {
    if (!_active) return;
    try {
      await _refreshAndSync();
    } catch (error) {
      final expiresAt = _tokenExpiresAt;
      if (expiresAt == null || !expiresAt.isAfter(DateTime.now().toUtc())) {
        if (!_authRefreshController.isClosed) _authRefreshController.add(null);
        await disconnect();
        return;
      }
      if (kDebugMode) {
        debugPrint(
          '[Realtime] Scoped token refresh failed: ${error.runtimeType}',
        );
      }
      _refreshTimer = Timer(_tokenRefreshRetry, () {
        unawaited(_refreshAfterTimer());
      });
    }
  }

  @override
  Future<void> disconnect() async {
    _active = false;
    _refreshTimer?.cancel();
    _refreshTimer = null;
    _tokenExpiresAt = null;
    _activeOrderId = null;
    _scopeVersion += 1;
    final channels = _channels.values.toList(growable: false);
    _channels.clear();
    _subscribedChannels.clear();
    for (final channel in channels) {
      await _client.removeChannel(channel);
    }
  }

  @override
  void dispose() {
    unawaited(disconnect());
    unawaited(_client.dispose());
    _driverLocationController.close();
    _orderStatusController.close();
    _etaController.close();
    _notificationController.close();
    _driverOfferController.close();
    _driverOrderAssignedController.close();
    _authRefreshController.close();
  }
}

void dispatchRealtimeOutboxRecord(
  Map<String, dynamic> row, {
  required String allowedChannel,
  required void Function(Map<String, dynamic>) onDriverLocation,
  required void Function(Map<String, dynamic>) onOrderStatus,
  required void Function(Map<String, dynamic>) onEtaUpdate,
  required void Function(Map<String, dynamic>) onNotification,
  required void Function(Map<String, dynamic>) onDriverOffer,
  required void Function(Map<String, dynamic>) onDriverOrderAssigned,
}) {
  if (row['channel'] != allowedChannel) return;
  final event = row['event'];
  final rawPayload = row['payload'];
  if (event is! String || rawPayload is! Map) return;
  final payload = Map<String, dynamic>.from(rawPayload);
  switch (event) {
    case 'driver:location_changed':
    case 'driver:location':
      onDriverLocation(payload);
    case 'order:status:changed':
    case 'order:status':
      onOrderStatus(payload);
    case 'delivery:eta_updated':
      onEtaUpdate(payload);
    case 'notification:new':
      onNotification(payload);
    case 'driver:new_order':
    case 'driver:offer':
      onDriverOffer(payload);
    case 'driver:order_assigned':
      onDriverOrderAssigned(payload);
  }
}

const _supportedBroadcastEvents = <String>{
  'driver:location_changed',
  'driver:location',
  'order:status:changed',
  'order:status',
  'delivery:eta_updated',
  'notification:new',
  'driver:new_order',
  'driver:offer',
  'driver:order_assigned',
};

void dispatchRealtimeBroadcastEvent(
  String event,
  Map<String, dynamic> payload, {
  required void Function(Map<String, dynamic>) onDriverLocation,
  required void Function(Map<String, dynamic>) onOrderStatus,
  required void Function(Map<String, dynamic>) onEtaUpdate,
  required void Function(Map<String, dynamic>) onNotification,
  required void Function(Map<String, dynamic>) onDriverOffer,
  required void Function(Map<String, dynamic>) onDriverOrderAssigned,
}) {
  dispatchRealtimeOutboxRecord(
    {'channel': 'broadcast', 'event': event, 'payload': payload},
    allowedChannel: 'broadcast',
    onDriverLocation: onDriverLocation,
    onOrderStatus: onOrderStatus,
    onEtaUpdate: onEtaUpdate,
    onNotification: onNotification,
    onDriverOffer: onDriverOffer,
    onDriverOrderAssigned: onDriverOrderAssigned,
  );
}

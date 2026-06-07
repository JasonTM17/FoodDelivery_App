import 'dart:async';
import 'dart:collection';
import 'package:geolocator/geolocator.dart';
import '../../shared/api/socket_client.dart';

/// Throttle interval while an active order is in-progress (battery-aggressive).
const _kActiveInterval = Duration(seconds: 4);

/// Throttle interval while online but idle (battery-conservative).
const _kIdleInterval = Duration(seconds: 30);

/// Max location pings to buffer offline before dropping oldest.
/// At 4s active rate: 200 × 4s ≈ 13 minutes of coverage.
const _kMaxBuffer = 200;

class _LocationPing {
  final double lat;
  final double lng;
  final DateTime timestamp;
  const _LocationPing(this.lat, this.lng, this.timestamp);
}

/// Streams driver GPS to the backend via WebSocket + offline buffer.
///
/// Throttle strategy:
/// - [_kActiveInterval] (4s) when [setActiveOrderMode] is called with `true`
/// - [_kIdleInterval] (30s) when idle online
///
/// Offline buffer: up to [_kMaxBuffer] pings are queued and flushed on
/// reconnect so no location data is silently dropped.
class BackgroundLocationService {
  BackgroundLocationService._();

  static BackgroundLocationService? _instance;
  static BackgroundLocationService get instance =>
      _instance ??= BackgroundLocationService._();

  StreamSubscription<Position>? _positionSub;
  Timer? _idleFlushTimer;
  Timer? _bufferFlushTimer;
  bool _running = false;
  bool _hasActiveOrder = false;
  DateTime? _lastEmit;
  Position? _lastPosition;

  final _offlineBuffer = Queue<_LocationPing>();
  final _positionController = StreamController<Position>.broadcast();

  /// Broadcast stream of raw [Position] updates from the device.
  Stream<Position> get positionStream => _positionController.stream;

  bool get isRunning => _running;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /// Request location permissions. Returns `true` if permission is granted
  /// and the location service is enabled.
  Future<bool> requestPermissions() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    return perm != LocationPermission.denied &&
        perm != LocationPermission.deniedForever;
  }

  /// Start the location stream. Safe to call multiple times — idempotent.
  ///
  /// [hasActiveOrder] sets the initial throttle mode.
  Future<void> start({bool hasActiveOrder = false}) async {
    if (_running) {
      setActiveOrderMode(hasActiveOrder);
      return;
    }

    final permitted = await requestPermissions();
    if (!permitted) return;

    _running = true;
    _hasActiveOrder = hasActiveOrder;

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      // Only emit when moved ≥10 m to suppress GPS jitter while stationary.
      distanceFilter: 10,
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: settings)
        .listen(_onPosition, onError: (_) {});

    // In idle mode the driver may stay stationary — push a heartbeat every 30s.
    _scheduleIdleTimer();

    // Flush any offline-buffered pings every 15s when back online.
    _bufferFlushTimer =
        Timer.periodic(const Duration(seconds: 15), (_) => _flushBuffer());
  }

  /// Stop all location streaming and timers. Call when driver goes offline.
  void stop() {
    _positionSub?.cancel();
    _positionSub = null;
    _idleFlushTimer?.cancel();
    _idleFlushTimer = null;
    _bufferFlushTimer?.cancel();
    _bufferFlushTimer = null;
    _running = false;
    _lastEmit = null;
  }

  /// Switch between active-order (4 s) and idle (30 s) throttle modes.
  void setActiveOrderMode(bool hasOrder) {
    _hasActiveOrder = hasOrder;
    _scheduleIdleTimer();
  }

  void dispose() {
    stop();
    if (!_positionController.isClosed) {
      _positionController.close();
    }
    _instance = null;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  void _scheduleIdleTimer() {
    _idleFlushTimer?.cancel();
    if (!_hasActiveOrder) {
      // Heartbeat so the server knows the driver is still online.
      _idleFlushTimer =
          Timer.periodic(_kIdleInterval, (_) => _emitLastKnown());
    }
  }

  void _onPosition(Position pos) {
    _lastPosition = pos;
    if (!_positionController.isClosed) {
      _positionController.add(pos);
    }

    final now = DateTime.now();
    final throttle = _hasActiveOrder ? _kActiveInterval : _kIdleInterval;
    if (_lastEmit != null && now.difference(_lastEmit!) < throttle) return;
    _lastEmit = now;
    _emitPosition(pos.latitude, pos.longitude, now);
  }

  void _emitLastKnown() {
    if (_lastPosition == null) return;
    _emitPosition(
        _lastPosition!.latitude, _lastPosition!.longitude, DateTime.now());
  }

  void _emitPosition(double lat, double lng, DateTime ts) {
    final socket = SocketClient.instance;
    if (socket.isConnected) {
      _flushBuffer();
      socket.emitLocationPing(lat, lng);
    } else {
      // Buffer so pings survive brief disconnects.
      if (_offlineBuffer.length >= _kMaxBuffer) {
        _offlineBuffer.removeFirst(); // drop oldest
      }
      _offlineBuffer.addLast(_LocationPing(lat, lng, ts));
    }
  }

  void _flushBuffer() {
    if (_offlineBuffer.isEmpty) return;
    final socket = SocketClient.instance;
    if (!socket.isConnected) return;
    while (_offlineBuffer.isNotEmpty) {
      final ping = _offlineBuffer.removeFirst();
      socket.emitLocationPing(ping.lat, ping.lng);
    }
  }
}

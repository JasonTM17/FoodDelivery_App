import 'dart:async';
import 'dart:collection';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../../shared/api/realtime_client.dart';

/// Throttle interval while an active order is in-progress (battery-aggressive).
const _kActiveInterval = Duration(seconds: 4);

/// Throttle interval while online but idle (battery-conservative).
const _kIdleInterval = Duration(seconds: 30);

/// Max location pings to buffer offline before dropping oldest.
/// This cap does not authorize replaying stale GPS samples as live state.
/// At 4s active rate: 200 × 4s ≈ 13 minutes of coverage.
const _kMaxBuffer = 200;

/// Buffered pings older than this are historical telemetry, not live map state.
const _kMaxBufferedPingAge = Duration(seconds: 45);

/// Accept a small future skew for device clocks, but do not replay impossible
/// future locations as live driver state.
const _kMaxLocationClockSkew = Duration(seconds: 15);

double? normalizeGpsBearingDegrees(double? headingDegrees) {
  if (headingDegrees == null || !headingDegrees.isFinite) return null;
  if (headingDegrees < 0 || headingDegrees >= 360) return null;
  return headingDegrees;
}

double? normalizeGpsSpeedKmh(double? metersPerSecond) {
  if (metersPerSecond == null || !metersPerSecond.isFinite) return null;
  if (metersPerSecond < 0) return null;
  return metersPerSecond * 3.6;
}

double? normalizeGpsAccuracyMeters(double? accuracyMeters) {
  if (accuracyMeters == null || !accuracyMeters.isFinite) return null;
  if (accuracyMeters < 0) return null;
  return accuracyMeters;
}

class _LocationPing {
  final double lat;
  final double lng;
  final double? bearing;
  final double? speed;
  final double? accuracy;
  final DateTime timestamp;
  const _LocationPing(
    this.lat,
    this.lng,
    this.timestamp, {
    this.bearing,
    this.speed,
    this.accuracy,
  });
}

/// Streams driver GPS to the backend command transport with an offline buffer.
///
/// Throttle strategy:
/// - [_kActiveInterval] (4s) when [setActiveOrderMode] is called with `true`
/// - [_kIdleInterval] (30s) when idle online
///
/// Offline buffer: up to [_kMaxBuffer] pings are queued and flushed on
/// reconnect so no location data is silently dropped.
class BackgroundLocationService {
  BackgroundLocationService._({LocationPingEmitter? socket})
    : _socket = socket ?? RealtimeClient.instance;

  @visibleForTesting
  BackgroundLocationService.forTesting({required LocationPingEmitter socket})
    : _socket = socket;

  static BackgroundLocationService? _instance;
  static BackgroundLocationService get instance =>
      _instance ??= BackgroundLocationService._();

  StreamSubscription<Position>? _positionSub;
  Timer? _idleFlushTimer;
  Timer? _bufferFlushTimer;
  bool _running = false;
  bool _hasActiveOrder = false;
  bool _isFlushing = false;
  DateTime? _lastEmit;
  Position? _lastPosition;
  final LocationPingEmitter _socket;

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

    _positionSub = Geolocator.getPositionStream(
      locationSettings: settings,
    ).listen(
      _onPosition,
      onError: (error) {
        debugPrint('Background location stream error: $error');
      },
    );

    // In idle mode the driver may stay stationary — push a heartbeat every 30s.
    _scheduleIdleTimer();

    // Flush any offline-buffered pings every 15s when back online.
    _bufferFlushTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => unawaited(_flushBuffer()),
    );
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
      _idleFlushTimer = Timer.periodic(
        _kIdleInterval,
        (_) => unawaited(_emitLastKnown()),
      );
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
    unawaited(
      _emitPosition(
        pos.latitude,
        pos.longitude,
        pos.timestamp,
        bearing: normalizeGpsBearingDegrees(pos.heading),
        speed: normalizeGpsSpeedKmh(pos.speed),
        accuracy: normalizeGpsAccuracyMeters(pos.accuracy),
      ),
    );
  }

  Future<void> _emitLastKnown() async {
    if (_lastPosition == null) return;
    await _emitPosition(
      _lastPosition!.latitude,
      _lastPosition!.longitude,
      _lastPosition!.timestamp,
      bearing: normalizeGpsBearingDegrees(_lastPosition!.heading),
      speed: normalizeGpsSpeedKmh(_lastPosition!.speed),
      accuracy: normalizeGpsAccuracyMeters(_lastPosition!.accuracy),
    );
  }

  Future<void> _emitPosition(
    double lat,
    double lng,
    DateTime ts, {
    double? bearing,
    double? speed,
    double? accuracy,
  }) async {
    final now = DateTime.now();
    if (!_isLiveReplaySafe(ts, now)) return;

    if (_socket.isConnected) {
      await _flushBuffer();
      try {
        await _socket.emitLocationPing(
          lat,
          lng,
          bearing: bearing,
          speed: speed,
          accuracy: accuracy,
          timestamp: ts,
        );
      } catch (_) {
        _bufferPing(
          _LocationPing(
            lat,
            lng,
            ts,
            bearing: bearing,
            speed: speed,
            accuracy: accuracy,
          ),
          now,
        );
      }
    } else {
      _bufferPing(
        _LocationPing(
          lat,
          lng,
          ts,
          bearing: bearing,
          speed: speed,
          accuracy: accuracy,
        ),
        now,
      );
    }
  }

  Future<void> _flushBuffer() async {
    if (_offlineBuffer.isEmpty) return;
    if (!_socket.isConnected) return;
    if (_isFlushing) return;
    _isFlushing = true;
    final now = DateTime.now();
    try {
      _dropStaleBufferedPings(now);
      while (_offlineBuffer.isNotEmpty && _socket.isConnected) {
        final ping = _offlineBuffer.removeFirst();
        if (!_isLiveReplaySafe(ping.timestamp, now)) continue;
        try {
          await _socket.emitLocationPing(
            ping.lat,
            ping.lng,
            bearing: ping.bearing,
            speed: ping.speed,
            accuracy: ping.accuracy,
            timestamp: ping.timestamp,
            bypassThrottle: true,
          );
        } catch (_) {
          _offlineBuffer.addFirst(ping);
          break;
        }
      }
    } finally {
      _isFlushing = false;
    }
  }

  void _bufferPing(_LocationPing ping, DateTime now) {
    _dropStaleBufferedPings(now);
    if (_offlineBuffer.length >= _kMaxBuffer) {
      _offlineBuffer.removeFirst();
    }
    _offlineBuffer.addLast(ping);
  }

  void _dropStaleBufferedPings(DateTime now) {
    while (_offlineBuffer.isNotEmpty &&
        !_isLiveReplaySafe(_offlineBuffer.first.timestamp, now)) {
      _offlineBuffer.removeFirst();
    }
  }

  bool _isLiveReplaySafe(DateTime timestamp, DateTime now) {
    final age = now.difference(timestamp);
    if (age > _kMaxBufferedPingAge) return false;
    if (age < -_kMaxLocationClockSkew) return false;
    return true;
  }

  @visibleForTesting
  Future<void> bufferLocationPingForTesting(
    double lat,
    double lng, {
    required DateTime timestamp,
    double? bearing,
    double? speed,
    double? accuracy,
  }) {
    return _emitPosition(
      lat,
      lng,
      timestamp,
      bearing: bearing,
      speed: speed,
      accuracy: accuracy,
    );
  }

  @visibleForTesting
  Future<void> flushBufferForTesting() => _flushBuffer();
}

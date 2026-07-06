import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/utils/backend_date_time.dart';

class RoutePoint {
  final double lat;
  final double lng;
  final DateTime timestamp;
  final String source;
  final bool timestampEstimated;

  const RoutePoint({
    required this.lat,
    required this.lng,
    required this.timestamp,
    this.source = 'telemetry',
    this.timestampEstimated = false,
  });

  factory RoutePoint.fromJson(Map<String, dynamic> json) {
    final lat = _readDoubleOrNull(json['lat']);
    final lng = _readDoubleOrNull(json['lng']);
    if (!isValidDeliveryLatLng(lat, lng)) {
      throw const FormatException('Invalid route point coordinates');
    }
    return RoutePoint(
      lat: lat!,
      lng: lng!,
      timestamp: parseBackendDateTimeOrUnknown(json['timestamp']),
      source: json['source']?.toString() ?? 'telemetry',
      timestampEstimated: json['timestampEstimated'] == true,
    );
  }
}

class RouteSegment {
  final double distanceKm;
  final int durationSeconds;
  final String instruction;
  final int startIndex;
  final int endIndex;

  const RouteSegment({
    required this.distanceKm,
    required this.durationSeconds,
    required this.instruction,
    required this.startIndex,
    required this.endIndex,
  });

  factory RouteSegment.fromJson(Map<String, dynamic> json) {
    return RouteSegment(
      distanceKm: _readDouble(json['distanceKm']),
      durationSeconds: _readInt(json['durationSeconds']),
      instruction: json['instruction']?.toString() ?? '',
      startIndex: _readInt(json['startIndex']),
      endIndex: _readInt(json['endIndex']),
    );
  }
}

class TripRouteDetail {
  final String tripId;
  final List<RoutePoint> points;
  final List<RouteSegment> segments;
  final String routeSource;
  final bool timestampsEstimated;
  final double totalDistanceKm;
  final int totalDurationSeconds;
  final double avgSpeedKmh;
  final double payout;

  const TripRouteDetail({
    required this.tripId,
    this.points = const [],
    this.segments = const [],
    this.routeSource = 'none',
    this.timestampsEstimated = false,
    this.totalDistanceKm = 0,
    this.totalDurationSeconds = 0,
    this.avgSpeedKmh = 0,
    this.payout = 0,
  });

  factory TripRouteDetail.fromJson(Map<String, dynamic> json) {
    return TripRouteDetail(
      tripId: json['tripId']?.toString() ?? '',
      points: _readList(
        json['points'],
      ).map(_tryReadRoutePoint).whereType<RoutePoint>().toList(growable: false),
      segments: _readList(json['segments'])
          .map((segment) => RouteSegment.fromJson(segment))
          .toList(growable: false),
      routeSource: json['routeSource']?.toString() ?? 'none',
      timestampsEstimated: json['timestampsEstimated'] == true,
      totalDistanceKm: _readDouble(json['totalDistanceKm']),
      totalDurationSeconds: _readInt(json['totalDurationSeconds']),
      avgSpeedKmh: _readDouble(json['avgSpeedKmh']),
      payout: _readDouble(json['payout']),
    );
  }
}

class TripRouteState {
  final TripRouteDetail? route;
  final bool isLoading;
  final String? error;
  final bool isReplaying;
  final double replayProgress; // 0.0 - 1.0

  const TripRouteState({
    this.route,
    this.isLoading = false,
    this.error,
    this.isReplaying = false,
    this.replayProgress = 0,
  });

  TripRouteState copyWith({
    TripRouteDetail? route,
    bool? isLoading,
    String? error,
    bool? isReplaying,
    double? replayProgress,
  }) {
    return TripRouteState(
      route: route ?? this.route,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isReplaying: isReplaying ?? this.isReplaying,
      replayProgress: replayProgress ?? this.replayProgress,
    );
  }
}

class TripRouteNotifier extends StateNotifier<TripRouteState> {
  TripRouteNotifier({ApiClient? api})
    : _api = api ?? ApiClient.instance,
      super(const TripRouteState());

  final ApiClient _api;

  Future<void> loadRoute(String tripId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/driver/trips/$tripId/route',
      );
      state = state.copyWith(
        isLoading: false,
        route: TripRouteDetail.fromJson(response.data ?? {}),
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'DRIVER_TRIP_ROUTE_UNAVAILABLE',
      );
    }
  }

  void startReplay() {
    state = state.copyWith(isReplaying: true, replayProgress: 0);
  }

  void updateReplayProgress(double progress) {
    state = state.copyWith(replayProgress: progress.clamp(0.0, 1.0));
  }

  void stopReplay() {
    state = state.copyWith(isReplaying: false, replayProgress: 0);
  }
}

final tripRouteProvider =
    StateNotifierProvider<TripRouteNotifier, TripRouteState>((ref) {
      return TripRouteNotifier();
    });

List<Map<String, dynamic>> _readList(Object? value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList(growable: false);
}

int _readInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

RoutePoint? _tryReadRoutePoint(Map<String, dynamic> json) {
  try {
    return RoutePoint.fromJson(json);
  } on FormatException {
    return null;
  }
}

double? _readDoubleOrNull(Object? value) {
  if (value is num && value.isFinite) return value.toDouble();
  final parsed = double.tryParse(value?.toString() ?? '');
  if (parsed != null && parsed.isFinite) return parsed;
  return null;
}

double _readDouble(Object? value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

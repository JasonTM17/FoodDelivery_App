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
      source: _readRequiredRoutePointSource(json['source']),
      timestampEstimated: _readRequiredBool(json['timestampEstimated']),
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
      distanceKm: _readRequiredDouble(json['distanceKm'], 'distanceKm'),
      durationSeconds: _readRequiredInt(
        json['durationSeconds'],
        'durationSeconds',
      ),
      instruction: _readRequiredString(json['instruction'], 'instruction'),
      startIndex: _readRequiredInt(json['startIndex'], 'startIndex'),
      endIndex: _readRequiredInt(json['endIndex'], 'endIndex'),
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
      tripId: _readRequiredString(json['tripId'], 'tripId'),
      points: _readRequiredList(
        json['points'],
        'points',
      ).map((point) => RoutePoint.fromJson(point)).toList(growable: false),
      segments: _readRequiredList(json['segments'], 'segments')
          .map((segment) => RouteSegment.fromJson(segment))
          .toList(growable: false),
      routeSource: _readRequiredRouteSource(json['routeSource']),
      timestampsEstimated: _readRequiredBool(json['timestampsEstimated']),
      totalDistanceKm: _readRequiredDouble(
        json['totalDistanceKm'],
        'totalDistanceKm',
      ),
      totalDurationSeconds: _readRequiredInt(
        json['totalDurationSeconds'],
        'totalDurationSeconds',
      ),
      avgSpeedKmh: _readRequiredDouble(json['avgSpeedKmh'], 'avgSpeedKmh'),
      payout: _readRequiredDouble(json['payout'], 'payout'),
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

List<Map<String, dynamic>> _readRequiredList(Object? value, String field) {
  if (value is! List) {
    throw FormatException('Invalid route list field: $field');
  }
  return value
      .map((item) {
        if (item is Map) {
          return Map<String, dynamic>.from(item);
        }
        throw FormatException('Invalid route list item: $field');
      })
      .toList(growable: false);
}

double? _readDoubleOrNull(Object? value) {
  if (value is num && value.isFinite) return value.toDouble();
  final parsed = double.tryParse(value?.toString() ?? '');
  if (parsed != null && parsed.isFinite) return parsed;
  return null;
}

String _readRequiredString(Object? value, String field) {
  final text = value?.toString().trim();
  if (text != null && text.isNotEmpty) {
    return text;
  }
  throw FormatException('Missing required route string field: $field');
}

bool _readRequiredBool(Object? value) {
  if (value is bool) return value;
  throw const FormatException('Invalid route boolean field');
}

int _readRequiredInt(Object? value, String field) {
  if (value is int && value >= 0) return value;
  if (value is num && value.isFinite && value >= 0 && value % 1 == 0) {
    return value.toInt();
  }
  final parsed = int.tryParse(value?.toString() ?? '');
  if (parsed != null && parsed >= 0) return parsed;
  throw FormatException('Invalid route integer field: $field');
}

double _readRequiredDouble(Object? value, String field) {
  if (value is num && value.isFinite) return value.toDouble();
  final parsed = double.tryParse(value?.toString() ?? '');
  if (parsed != null && parsed.isFinite) return parsed;
  throw FormatException('Invalid route numeric field: $field');
}

String _readRequiredRoutePointSource(Object? value) {
  final source = _readRequiredString(value, 'source');
  if (source == 'telemetry' || source == 'persisted_geometry') return source;
  throw FormatException('Invalid route point source: $source');
}

String _readRequiredRouteSource(Object? value) {
  final source = _readRequiredString(value, 'routeSource');
  if (source == 'telemetry' ||
      source == 'persisted_geometry' ||
      source == 'none') {
    return source;
  }
  throw FormatException('Invalid route source: $source');
}

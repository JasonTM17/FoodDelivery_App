import 'package:flutter_riverpod/flutter_riverpod.dart';

class RoutePoint {
  final double lat;
  final double lng;
  final DateTime timestamp;

  const RoutePoint({
    required this.lat,
    required this.lng,
    required this.timestamp,
  });
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
}

class TripRouteDetail {
  final String tripId;
  final List<RoutePoint> points;
  final List<RouteSegment> segments;
  final double totalDistanceKm;
  final int totalDurationSeconds;
  final double avgSpeedKmh;
  final double payout;

  const TripRouteDetail({
    required this.tripId,
    this.points = const [],
    this.segments = const [],
    this.totalDistanceKm = 0,
    this.totalDurationSeconds = 0,
    this.avgSpeedKmh = 0,
    this.payout = 0,
  });
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
  TripRouteNotifier() : super(const TripRouteState());

  Future<void> loadRoute(String tripId) async {
    state = state.copyWith(isLoading: true, error: null);
    // TODO: Replace with real API GET /driver/trips/{tripId}/route
    await Future.delayed(const Duration(milliseconds: 500));
    final points = _samplePoints();
    state = state.copyWith(
      isLoading: false,
      route: TripRouteDetail(
        tripId: tripId,
        points: points,
        segments: _sampleSegments(),
        totalDistanceKm: 3.5,
        totalDurationSeconds: 720,
        avgSpeedKmh: 17.5,
        payout: 25000,
      ),
    );
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

  List<RoutePoint> _samplePoints() {
    final baseLat = 10.8231;
    final baseLng = 106.6297;
    final points = <RoutePoint>[];
    final now = DateTime.now().subtract(const Duration(hours: 2));
    for (int i = 0; i < 40; i++) {
      final t = i / 39;
      points.add(RoutePoint(
        lat: baseLat + (0.002 + t * 0.008),
        lng: baseLng + (0.001 + t * 0.006),
        timestamp: now.add(Duration(seconds: (t * 720).round())),
      ));
    }
    return points;
  }

  List<RouteSegment> _sampleSegments() {
    return [
      const RouteSegment(
        distanceKm: 1.2,
        durationSeconds: 240,
        instruction: 'Rẽ phải vào Nguyễn Văn Linh',
        startIndex: 0,
        endIndex: 12,
      ),
      const RouteSegment(
        distanceKm: 1.5,
        durationSeconds: 300,
        instruction: 'Đi thẳng trên Lê Văn Lương',
        startIndex: 13,
        endIndex: 28,
      ),
      const RouteSegment(
        distanceKm: 0.8,
        durationSeconds: 180,
        instruction: 'Rẽ trái vào Trần Não',
        startIndex: 29,
        endIndex: 39,
      ),
    ];
  }
}

final tripRouteProvider =
    StateNotifierProvider<TripRouteNotifier, TripRouteState>((ref) {
  return TripRouteNotifier();
});

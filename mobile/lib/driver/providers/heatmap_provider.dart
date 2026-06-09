import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:math';

class HeatmapPoint {
  final double lat;
  final double lng;
  final int demandLevel; // 0=low, 1=medium, 2=high
  final int orderCount;
  final double avgPayout;

  const HeatmapPoint({
    required this.lat,
    required this.lng,
    required this.demandLevel,
    required this.orderCount,
    required this.avgPayout,
  });
}

class HeatmapState {
  final List<HeatmapPoint> points;
  final bool isLoading;
  final String? error;
  final String selectedWindow; // 'now', '1h', '3h', 'today'

  const HeatmapState({
    this.points = const [],
    this.isLoading = false,
    this.error,
    this.selectedWindow = 'now',
  });

  HeatmapState copyWith({
    List<HeatmapPoint>? points,
    bool? isLoading,
    String? error,
    String? selectedWindow,
  }) {
    return HeatmapState(
      points: points ?? this.points,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedWindow: selectedWindow ?? this.selectedWindow,
    );
  }
}

class HeatmapNotifier extends StateNotifier<HeatmapState> {
  HeatmapNotifier() : super(const HeatmapState());

  Future<void> loadHeatmap(
    double lat,
    double lng, {
    String window = 'now',
    double radiusKm = 5,
  }) async {
    state = state.copyWith(isLoading: true, error: null, selectedWindow: window);
    // TODO: replace with real API call GET /driver/heatmap?lat=...&lng=...&radius=...&window=...
    await Future.delayed(const Duration(milliseconds: 500));
    state = state.copyWith(
      isLoading: false,
      points: _generateSampleData(lat, lng),
    );
  }

  void setWindow(String window, double lat, double lng) {
    loadHeatmap(lat, lng, window: window);
  }

  List<HeatmapPoint> _generateSampleData(double centerLat, double centerLng) {
    final rng = Random(42);
    final points = <HeatmapPoint>[];
    for (int i = 0; i < 80; i++) {
      final offsetLat = (rng.nextDouble() - 0.5) * 0.05;
      final offsetLng = (rng.nextDouble() - 0.5) * 0.05;
      final level = rng.nextInt(3);
      points.add(HeatmapPoint(
        lat: centerLat + offsetLat,
        lng: centerLng + offsetLng,
        demandLevel: level,
        orderCount: level == 2 ? 15 + rng.nextInt(30) : level == 1 ? 5 + rng.nextInt(15) : rng.nextInt(5),
        avgPayout: level == 2 ? 30000 + rng.nextDouble() * 20000 : 20000 + rng.nextDouble() * 15000,
      ));
    }
    return points;
  }
}

final heatmapProvider =
    StateNotifierProvider<HeatmapNotifier, HeatmapState>((ref) {
  return HeatmapNotifier();
});

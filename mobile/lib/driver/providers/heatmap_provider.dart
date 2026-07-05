import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/api/api_client.dart';
import '../../shared/maps/lat_lng_validation.dart';

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

  factory HeatmapPoint.fromJson(Map<String, dynamic> json) {
    final lat = _readDoubleOrNull(json['lat']);
    final lng = _readDoubleOrNull(json['lng']);
    if (!isValidDeliveryLatLng(lat, lng)) {
      throw const FormatException('Invalid heatmap coordinates');
    }
    return HeatmapPoint(
      lat: lat!,
      lng: lng!,
      demandLevel: _readInt(json['demandLevel']).clamp(0, 2).toInt(),
      orderCount: _readInt(json['orderCount']),
      avgPayout: _readDouble(json['avgPayout']),
    );
  }
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
  final ApiClient _api;

  HeatmapNotifier({ApiClient? api})
    : _api = api ?? ApiClient.instance,
      super(const HeatmapState());

  Future<void> loadHeatmap(
    double lat,
    double lng, {
    String window = 'now',
    double radiusKm = 5,
  }) async {
    if (!isValidDeliveryLatLng(lat, lng)) {
      state = state.copyWith(
        isLoading: false,
        points: const [],
        error: 'DRIVER_HEATMAP_LOCATION_REQUIRED',
        selectedWindow: window,
      );
      return;
    }
    state = state.copyWith(
      isLoading: true,
      error: null,
      selectedWindow: window,
    );
    try {
      final response = await _api.get<List<dynamic>>(
        '/driver/heatmap',
        queryParameters: {
          'lat': lat,
          'lng': lng,
          'radius': radiusKm,
          'window': window,
        },
      );
      final points = (response.data ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(_tryReadHeatmapPoint)
          .whereType<HeatmapPoint>()
          .toList(growable: false);
      state = state.copyWith(isLoading: false, points: points, error: null);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        points: const [],
        error: 'DRIVER_HEATMAP_UNAVAILABLE',
      );
    }
  }

  void setWindow(String window, double lat, double lng) {
    loadHeatmap(lat, lng, window: window);
  }
}

final heatmapProvider = StateNotifierProvider<HeatmapNotifier, HeatmapState>((
  ref,
) {
  return HeatmapNotifier();
});

HeatmapPoint? _tryReadHeatmapPoint(Map<String, dynamic> json) {
  try {
    return HeatmapPoint.fromJson(json);
  } on FormatException {
    return null;
  }
}

double? _readDoubleOrNull(dynamic value) {
  if (value is num && value.isFinite) return value.toDouble();
  if (value is String) {
    final parsed = double.tryParse(value);
    if (parsed != null && parsed.isFinite) return parsed;
  }
  return null;
}

double _readDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}

int _readInt(dynamic value) {
  if (value is num) return value.round();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

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
      demandLevel: _requiredDemandLevel(json, 'demandLevel'),
      orderCount: _requiredNonNegativeInt(json, 'orderCount'),
      avgPayout: _requiredNonNegativeDouble(json, 'avgPayout'),
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
      final data = response.data;
      if (data is! List) {
        throw const FormatException('Invalid heatmap response');
      }
      final points = data
          .map((item) {
            if (item is! Map) {
              throw const FormatException('Invalid heatmap point');
            }
            return HeatmapPoint.fromJson(Map<String, dynamic>.from(item));
          })
          .toList(growable: false);
      state = state.copyWith(isLoading: false, points: points, error: null);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        points: const [],
        error: 'DRIVER_HEATMAP_CONTRACT_INVALID_RESPONSE',
      );
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

double? _readDoubleOrNull(dynamic value) {
  if (value is num && value.isFinite) return value.toDouble();
  if (value is String) {
    final parsed = double.tryParse(value);
    if (parsed != null && parsed.isFinite) return parsed;
  }
  return null;
}

double _requiredNonNegativeDouble(Map<String, dynamic> json, String field) {
  final parsed = _readDoubleOrNull(json[field]);
  if (parsed != null && parsed >= 0) return parsed;
  throw FormatException('Missing required heatmap numeric field: $field');
}

int _requiredNonNegativeInt(Map<String, dynamic> json, String field) {
  final value = json[field];
  final parsed = value is int
      ? value
      : value is String
      ? int.tryParse(value)
      : null;
  if (parsed != null && parsed >= 0) return parsed;
  throw FormatException('Missing required heatmap integer field: $field');
}

int _requiredDemandLevel(Map<String, dynamic> json, String field) {
  final parsed = _requiredNonNegativeInt(json, field);
  if (parsed <= 2) return parsed;
  throw FormatException('Invalid heatmap demand level: $parsed');
}
